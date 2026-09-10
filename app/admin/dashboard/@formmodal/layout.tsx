import { LayoutProps } from "@/types/ui";

function ModalLayout({ children }: LayoutProps) {
    if (!children) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-xs bg-black/50 z-50 flex items-center justify-end">
            {children}
        </div>
    );
}

export default ModalLayout;