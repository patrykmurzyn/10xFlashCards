# Product Requirements Document (PRD) – 10xFlashCards

## 1. Product Overview

10xFlashCards is a web application designed to streamline the creation of educational flashcards. The core concept involves leveraging Language Models (LLMs) via API to automatically generate flashcard suggestions based on user-provided text, enabling more efficient management of learning materials.

## 2. User Problem

Manually creating high-quality educational flashcards is a time-consuming and labor-intensive process. This barrier often discourages users from regularly employing the spaced repetition method, despite its proven effectiveness. The 10xFlashCards product aims to address this difficulty by significantly speeding up the flashcard creation process (questions and answers) and simplifying the organization of study materials.

## 3. Functional Requirements

1.  AI-Powered Flashcard Generation: The user provides text (e.g., by pasting). The system sends this text to an external LLM API, which returns proposed flashcards (question/answer) for user review. The flashcards are presented as a list with options to accept, edit, or reject each one.
2.  Flashcard Management: Ability to manually add flashcards (front/back) using a dedicated form, edit existing ones (both manually created and AI-generated), and delete them. Manually created flashcards are displayed in the same list view as generated ones.
3.  User Account System: Functionality for registration (email/password), login, and the option to delete an account upon request, resulting in the removal of all associated user data, including flashcards.
4.  Integration with Repetition Algorithm: Connect user-saved flashcards with a ready-made, external mechanism (e.g., an open-source library) implementing a spaced repetition algorithm. The MVP does not require the implementation of advanced metadata or repetition-related notifications.
5.  Data Storage: User data (accounts) and flashcard content are stored securely and in a manner that allows for future application scaling.
6.  AI Usage Tracking: The system collects anonymous statistics regarding the number of flashcards suggested by the AI and the number of flashcards accepted by users after generation.
7.  Legal Compliance: Users' personal data and the content they create (flashcards) are processed in accordance with applicable data protection regulations (GDPR). Users have the right to access their data and request its deletion (by deleting their account).

## 4. Product Boundaries

1.  Features Excluded from MVP Scope:
    - Development of a proprietary, advanced repetition algorithm (instead, integration with a ready-made solution, e.g., an open-source library).
    - Gamification elements.
    - Native mobile applications (the product is available exclusively as a web application).
    - Support for importing files in various formats (e.g., PDF, DOCX) as a source text for flashcard generation.
    - Providing a public API for developers.
    - Social features, such as sharing flashcard decks between users.
    - An advanced user notification system (e.g., reminders for study sessions).
    - Text search functionality within the user's flashcard content.

## 5. User Stories

ID: US-001
Title: Create a New Account
Description: As a person wanting to use the application, I need the ability to create an account so that I can save my flashcards and use the AI generation features.
Acceptance Criteria:

- A registration form is available requiring an email address and password.
- The system validates the correctness of the entered data (email format, password requirements).
- Upon successful validation and form submission, a new user account is created.
- The user is automatically logged in after registration and sees a confirmation of account creation.

ID: US-002
Title: Access the Application via Login
Description: As a registered user, I want to be able to log into the system using my credentials (email and password) to access my saved flashcards and application features.
Acceptance Criteria:

- A login form with fields for email and password is available.
- After entering correct credentials, the user gains access to the main application interface (e.g., the flashcard generation view).
- If incorrect data is entered, an appropriate error message is displayed.
- The user session is managed securely.

ID: US-003
Title: Initiate AI Flashcard Generation
Description: As a logged-in user, I want to be able to paste a piece of text into a dedicated field and initiate the AI flashcard generation process, allowing me to prepare study materials more quickly.
Acceptance Criteria:

- The application interface includes a text area for entering source text.
- The text area accepts text within a defined length range (e.g., between 1000 and 10000 characters).
- A button ("Generate Flashcards" or similar) is available, which, when clicked, triggers the process of sending the text to the LLM API.
- During processing, the user may see a progress indicator or information about the ongoing process.
- After generation is complete, the proposed flashcards are displayed to the user.
- In case of an LLM API communication error or another technical issue, the user receives a clear error message.

ID: US-004
Title: Review and Save Generated Flashcards
Description: As a user, after receiving flashcard suggestions from the AI, I want to be able to review them, edit, accept, or reject them individually, so that I ultimately save only those I deem valuable.
Acceptance Criteria:

- AI-generated flashcard suggestions (question/answer) are presented in a list format.
- Each suggested flashcard in the list has options: 'Accept', 'Edit', 'Reject'.
- Selecting 'Edit' allows modification of the question and/or answer content before acceptance.
- Selecting 'Accept' marks the flashcard as ready to be saved.
- Selecting 'Reject' removes the suggestion from the list.
- A button ('Save Accepted' or similar) is available, which saves all accepted (and potentially edited) flashcards to the database associated with the user's account.

ID: US-005
Title: Modify Saved Flashcards
Description: As a user, I want the ability to edit the content (question or answer) of my saved flashcards, both those created manually and those accepted after AI generation, so that I can correct or adjust them.
Acceptance Criteria:

- There is a view (e.g., "My Flashcards") listing all the user's saved flashcards.
- Each flashcard in the list has an available edit option.
- Selecting the edit option opens a form with the current question and answer content, allowing modification.
- After making changes and confirming them, the updated flashcard content is saved in the database.

ID: US-006
Title: Delete Unnecessary Flashcards
Description: As a user, I want the ability to permanently delete individual flashcards from my collection to maintain order in my study materials.
Acceptance Criteria:

- In the list view of my flashcards, each item has an available delete option.
- Clicking the delete option requires additional confirmation from the user (e.g., in a dialog box) to prevent accidental deletion.
- Upon confirmation, the selected flashcard is permanently removed from the user's database.

ID: US-007
Title: Add Flashcards Manually
Description: As a user, I want the ability to manually add a new flashcard by entering my own question (front) and answer (back), so I can create flashcards independently of the AI generation feature.
Acceptance Criteria:

- Within the application interface (e.g., in the "My Flashcards" view), there is a button to initiate adding a new flashcard.
- Clicking the button opens a form with text fields for 'Question' (front) and 'Answer' (back).
- After filling the fields and submitting the form, the new flashcard is created and saved in the user's database.
- The newly added flashcard appears in the user's list of flashcards.

ID: US-008
Title: Use the Study Session Feature
Description: As a user, I want access to a study mode ("Study Session") where my saved flashcards are presented according to the logic of the integrated spaced repetition algorithm, so I can effectively learn the material.
Acceptance Criteria:

- There is a dedicated "Study Session" view or section.
- Upon entering the session, the repetition algorithm selects flashcards due for review for that day/session.
- During the session, only the question (front of the flashcard) is displayed initially.
- The user has an option to reveal the answer (back of the flashcard) through interaction (e.g., a click).
- After seeing the answer, the user rates their recall of the flashcard (e.g., 'easy', 'hard', 'repeat') as required by the integrated algorithm.
- Based on the user's rating, the algorithm schedules the next review for that flashcard.
- The algorithm presents subsequent flashcards within the current study session.

ID: US-009
Title: Protect User Data Privacy
Description: As a user, I want assurance that my account and the flashcards I create are private and accessible only to me, ensuring the security of my data.
Acceptance Criteria:

- Accessing, editing, deleting flashcards, and initiating AI generation requires an active, authenticated user session.
- The system ensures data separation between different user accounts – user A cannot access user B's data.
- There is no functionality allowing public sharing or sharing of flashcards with other users within the MVP scope.

## 6. Success Metrics

1.  AI Flashcard Acceptance Rate: Measured as the ratio of AI-generated flashcards accepted by the user to the total number of flashcards suggested by the AI. Target: >= 75%.
2.  AI Contribution to Flashcard Creation: Measured as the ratio of flashcards added to the system using the AI generation feature (after acceptance) to the total number of newly added flashcards (AI + manual) over a given period. Target: >= 75%.
3.  Engagement Monitoring: Tracking the number of generated and saved flashcards per user/session to assess the usability of the AI feature and overall engagement in material creation.
