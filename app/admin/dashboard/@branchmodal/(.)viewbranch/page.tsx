'use client';

import styles from "@/styles/component/view-staff.module.css";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { X, UserCheck } from "lucide-react";
import InputField from "@/components/ui/text-field";
import SelectField from "@/components/ui/select-field";
import Button from "@/components/ui/button";
import Link from "next/link";

const ViewStaffProfile = () => {
    const router = useRouter();
    const { branchId } = useParams();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') router.back();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);


    return (

        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.headerLeft}>
                        <div className="text-(--secondary-color)">
                            <UserCheck size={16} />
                        </div>

                        <span>STAFF PROFILE</span>
                    </div>

                    <div className={styles.closeBtn} onClick={() => router.back()}>
                        <X size={14} />
                    </div>
                </div>
            </div>

            <div className={styles.body}>
                <div className={styles.topSection}>
                    <div className={styles.topInner}>

                        <div className={styles.image}>
                            <Image
                                src="/all-images/image-pix/avatar.jpg"
                                alt="profile"
                                width={70}
                                height={70}
                            />
                        </div>

                        <div className={styles.text}>
                            <h2>MR ADEYEMI AYOBAMI SAMSON</h2>
                            <div className={styles.meta}>
                                <span className={`${styles.status} ${styles.active}`}>
                                    Status
                                </span>
                                <span>| LAST LOGIN</span>
                                <strong>2026-04-30</strong>
                            </div>
                        </div>

                    </div>
                </div>

                <div className={styles.formWrapper}>
                    <div className={styles.formInner}>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>STAFF BASIC INFORMATION</h3>

                            <div className={styles.fieldGroup}>
                                <div className={styles.half}>
                                    <SelectField
                                        id="title"
                                        label="Select Title"
                                        options={[]}
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="firstName"
                                        label="First Name"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="middleName"
                                        label="Middle Name"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="lastName"
                                        label="Last Name"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <SelectField
                                        id="gender"
                                        label="Select Gender"
                                        options={[]}
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="phone"
                                        label="Phone Number"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="email"
                                        label="Email Address"
                                        type="email"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="dob"
                                        label="Date Of Birth"
                                        type="date"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>STAFF RESIDENT INFORMATION</h3>

                            <div className={styles.fieldGroup}>
                                <div className={styles.half}>
                                    <InputField
                                        id="country"
                                        label="Country"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="state"
                                        label="State"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="lga"
                                        label="Local Govenment Area"
                                    />
                                </div>

                                <div className={styles.half}>
                                    <InputField
                                        id="address"
                                        label="Home Address"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>STAFF ACCOUNT INFORMATION</h3>

                            <div className={styles.fieldGroup}>
                                <div className={styles.third}>
                                    <InputField
                                        id="staffId"
                                        label="Staff ID"
                                        readOnly
                                    />
                                </div>

                                <div className={styles.third}>
                                    <InputField
                                        id="createdTime"
                                        label="Created Time"
                                        readOnly
                                        type="date"
                                    />
                                </div>

                                <div className={styles.third}>
                                    <InputField
                                        id="lastLogin"
                                        label="Last Login"
                                        readOnly
                                        type="date"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>ADMINISTRATIVE INFORMATION</h3>

                            <div className={styles.fieldGroup}>
                                <div className={styles.half}>
                                    <SelectField
                                        id="role"
                                        label="Select Role"
                                        options={[]}
                                    />
                                </div>

                                <div className={styles.half}>
                                    <SelectField
                                        id="status"
                                        label="Select Status"
                                        options={[]}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="max-w-50 flex justify-end items-end">
                            <Button
                                id="update-btn"
                                text="UPDATE PROFILE"
                                type="button"
                            />

                            <Link href={`/admin/dashboard/branch/${branchId}`}>
                                <Button
                                    id="submit-btn"
                                    text="SUBMIT"
                                    type="button"
                                />
                            </Link>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default ViewStaffProfile;