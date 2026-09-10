import { TextFieldProps } from "@/types/ui";
import styles from "@/styles/component/textfield.module.css";

const InputField = (props: TextFieldProps) => {
    return (
        <div className={styles.formGroup}>
            <input
                id={props.id}
                type={props.type}
                title={props.label}
                className={`${styles.floatingInput} ${props.className ?? ""}`}
                placeholder=" "
                value={props.value}
                required={props.required ?? false}
                onChange={props.onChange}
                readOnly={props.readOnly}
                maxLength={props.maxLength}
            />
            <label
                htmlFor={props.id}
                className={`${styles.floatingLabel}`}>{props.label}
            </label>
        </div>
    );
};

export default InputField;