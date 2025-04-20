import React from "react";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  disabled,
  onClick,
}) => {
  return (
    <Button
      variant="default"
      size="default"
      disabled={disabled}
      onClick={onClick}
    >
      Generate
    </Button>
  );
};

export default GenerateButton;
