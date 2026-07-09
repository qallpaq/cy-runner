type CommonInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
};

type TextInputProps = {
  type?: "text";
  min?: never;
  max?: never;
};

type NumberInputProps = {
  type: "number";
  min?: number;
  max?: number;
};

type InputProps = (TextInputProps | NumberInputProps) & CommonInputProps;

export const Input = ({ label, onChange, ...rest }: InputProps) => {
  return (
    <label className="vstack gap-1">
      <span>{label}</span>
      <input onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
};
