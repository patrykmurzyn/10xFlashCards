import React from "react";
import { Button } from "@/components/ui/button";

interface SaveSelectedButtonProps {
  disabled: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

const SaveSelectedButton: React.FC<SaveSelectedButtonProps> = ({
  disabled,
  isLoading,
  onClick,
}) => {
  return (
    <Button
      variant="default"
      size="default"
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? "Saving..." : "Save Selected"}
    </Button>
  );
};

export default SaveSelectedButton;
