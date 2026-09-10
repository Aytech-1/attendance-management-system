'use client';

import { Toast } from "@/types/ui";
import styles from "@/styles/component/toast.module.css";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

interface ToastItemProps {
    toast: Toast;
    onClose?: () => void; // ✅ add this
}

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
    const icons = {
        success: <CheckCircle size={18} />,
        error: <XCircle size={18} />,
        info: <Info size={18} />,
    };

    return (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
            <div className={styles.icon}>{icons[toast.type]}</div>

            <span className="flex-1">{toast.message}</span>

            {/* ✅ now valid */}
            <button onClick={onClose} className={styles.closeBtn}>
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastItem;