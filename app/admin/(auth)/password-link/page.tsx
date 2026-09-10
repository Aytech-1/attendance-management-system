'use client';
import Button from "@/components/ui/button";
import { useRouter } from 'next/navigation';

const PasswordLink = () => {
    const router = useRouter()
    return (
        <>
            <div className="w-[80%] flex flex-col gap-5 justify-center items-center mx-auto">
                <h1 className='text-2xl! text-center'>Mail sent successfully</h1>

                <p className='w-full text-[12px] text-gray-500 bg-amber-100 p-4 rounded border border-amber-300'>Dear <span className="text-[12px] text-(--primary-color) cursor-pointer">MR BAMIRIN XISCO</span>, a link has been sent to your email address (<span className="text-[12px] text-(--primary-color) cursor-pointer">bamirin@mail.com</span>) to reset your password. Kindly check  your INBOX or SPAM FOLDER to confirm.</p>

                <Button
                    id="okay-btn"
                    text="OKAY"
                      onClick={() => router.push('/admin/login')}
                />

                <p>MAIL not recieved? RESEND MAIL</p>
            </div>
        </>
    )
}

export default PasswordLink