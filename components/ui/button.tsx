import { ButtonProps } from "@/types/ui";
import styles from "@/styles/component/button.module.css";

const Button = (props: ButtonProps) => {
    return (
        
        <button
            id={props.id}
            title={props.text}
            type={props.type || "button"}
            onClick={props.onClick}
            disabled={props.disabled}
            className={`
                ${styles.button}
                ${props.variant === "secondary" ? styles.secondary : styles.primary}
                ${props.className || ""}
            `}>
            {props.leftIcon && <span className={styles.icon}>{props.leftIcon}</span>}

            {props.text}

            {props.rightIcon && <span className={styles.icon}>{props.rightIcon}</span>}
        </button>
        
    );
};

export default Button;