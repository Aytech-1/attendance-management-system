'use client';

import { createContext, useContext, useState } from "react";
import { Toast, ToastContextType, ToastType } from "@/types/ui";
import ToastItem from "./toast";
import styles from "@/styles/component/toast.module.css";

const ToastContext = createContext<ToastContextType | null>(null);

/* =========================
   HOOK
========================= */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }
    return context;
};

/* =========================
   PROVIDER
========================= */
const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = "success") => {
        const id = Date.now();

        // ✅ Replace all existing toasts (professional UX)
        setToasts([{ id, message, type }]);

        // auto remove after 4s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* TOAST CONTAINER */}
            <div className={styles.toastContainer}>
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;