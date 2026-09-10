export interface LayoutProps {
  children: React.ReactNode;
  formmodal?: React.ReactNode;
  branchmodal?: React.ReactNode;
}

export interface TextFieldProps {
  id: string;
  type?: "text" | "password" | "email" | "number" | "date" | "time";
  readOnly?: boolean;
  label: string;
  maxLength?: number;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}


export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export interface ButtonProps {
  id: string;
  text: string;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "secondary";
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export type ToastType = "success" | "error" | "info";

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}







