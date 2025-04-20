-- migration: 20240702140110_create_tables.sql
-- description: creates tables for flashcards, generations, and generation_error_logs with proper relationships to auth.users

-- create extension if it doesn't exist
create extension if not exists "uuid-ossp";

-- table: flashcards
create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar(50) not null check (source in ('ai-full', 'ai-edited', 'manual')),
  generation_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- table: generations
create table if not exists public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar(50) not null,
  generated_count int4 not null,
  accepted_unedited_count int4,
  accepted_edited_count int4,
  source_text_hash varchar not null,
  source_text_length int4 not null check (source_text_length between 500 and 10000),
  generation_duration int4 not null, -- time in seconds
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- table: generation_error_logs
create table if not exists public.generation_error_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length int4 not null check (source_text_length between 500 and 10000),
  error_code varchar not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- create indexes for performance optimization
create index if not exists flashcards_user_id_idx on public.flashcards(user_id);
create index if not exists flashcards_created_at_idx on public.flashcards(created_at);
create index if not exists flashcards_generation_id_idx on public.flashcards(generation_id);
create index if not exists generations_user_id_idx on public.generations(user_id);
create index if not exists generations_created_at_idx on public.generations(created_at);
create index if not exists generation_error_logs_user_id_idx on public.generation_error_logs(user_id);

-- add foreign key constraint for flashcards.generation_id
alter table public.flashcards
  add constraint flashcards_generation_id_fkey
  foreign key (generation_id)
  references public.generations(id)
  on delete set null;

-- create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- add updated_at triggers
create trigger set_flashcards_updated_at
  before update on public.flashcards
  for each row
  execute procedure public.handle_updated_at();

create trigger set_generations_updated_at
  before update on public.generations
  for each row
  execute procedure public.handle_updated_at();

-- enable row level security
alter table public.flashcards enable row level security;
alter table public.generations enable row level security;
alter table public.generation_error_logs enable row level security;

-- rls policies for flashcards
-- policy for select (authenticated users can only select their own flashcards)
create policy "Users can view their own flashcards"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy for select (anon users have no access)
create policy "Anon users cannot view flashcards"
  on public.flashcards
  for select
  to anon
  using (false);

-- policy for insert (authenticated users can only insert their own flashcards)
create policy "Users can insert their own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy for insert (anon users have no access)
create policy "Anon users cannot insert flashcards"
  on public.flashcards
  for insert
  to anon
  with check (false);

-- policy for update (authenticated users can only update their own flashcards)
create policy "Users can update their own flashcards"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy for update (anon users have no access)
create policy "Anon users cannot update flashcards"
  on public.flashcards
  for update
  to anon
  using (false)
  with check (false);

-- policy for delete (authenticated users can only delete their own flashcards)
create policy "Users can delete their own flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- policy for delete (anon users have no access)
create policy "Anon users cannot delete flashcards"
  on public.flashcards
  for delete
  to anon
  using (false);

-- rls policies for generations
-- policy for select (authenticated users can only select their own generations)
create policy "Users can view their own generations"
  on public.generations
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy for select (anon users have no access)
create policy "Anon users cannot view generations"
  on public.generations
  for select
  to anon
  using (false);

-- policy for insert (authenticated users can only insert their own generations)
create policy "Users can insert their own generations"
  on public.generations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy for insert (anon users have no access)
create policy "Anon users cannot insert generations"
  on public.generations
  for insert
  to anon
  with check (false);

-- policy for update (authenticated users can only update their own generations)
create policy "Users can update their own generations"
  on public.generations
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy for update (anon users have no access)
create policy "Anon users cannot update generations"
  on public.generations
  for update
  to anon
  using (false)
  with check (false);

-- policy for delete (authenticated users can only delete their own generations)
create policy "Users can delete their own generations"
  on public.generations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- policy for delete (anon users have no access)
create policy "Anon users cannot delete generations"
  on public.generations
  for delete
  to anon
  using (false);

-- rls policies for generation_error_logs
-- policy for select (authenticated users can only select their own error logs)
create policy "Users can view their own error logs"
  on public.generation_error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy for select (anon users have no access)
create policy "Anon users cannot view error logs"
  on public.generation_error_logs
  for select
  to anon
  using (false);

-- policy for insert (authenticated users can only insert their own error logs)
create policy "Users can insert their own error logs"
  on public.generation_error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy for insert (anon users have no access)
create policy "Anon users cannot insert error logs"
  on public.generation_error_logs
  for insert
  to anon
  with check (false);

-- policy for update (authenticated users can only update their own error logs)
create policy "Users can update their own error logs"
  on public.generation_error_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy for update (anon users have no access)
create policy "Anon users cannot update error logs"
  on public.generation_error_logs
  for update
  to anon
  using (false)
  with check (false);

-- policy for delete (authenticated users can only delete their own error logs)
create policy "Users can delete their own error logs"
  on public.generation_error_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- policy for delete (anon users have no access)
create policy "Anon users cannot delete error logs"
  on public.generation_error_logs
  for delete
  to anon
  using (false); 