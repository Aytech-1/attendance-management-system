'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutModal from '@/components/ui/logout-modal';

const LogoutPage = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        router.back();
    };

    return (
        <div className="w-full h-screen flex justify-center items-center bg-gray-50 font-sans text-gray-600 text-sm font-semibold">
            <LogoutModal
                isOpen={isOpen}
                onClose={handleClose}
                redirectPath="/admin/login"
            />
        </div>
    );
};

export default LogoutPage;