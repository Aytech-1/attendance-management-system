'use client'
import tableStyles from "@/styles/component/table.module.css";
import styles from "@/styles/component/dashboard.module.css";
import { useDepartments } from "@/components/api/client";
import { useState } from "react";
import Link from "next/link";
import {
    SquarePlus,
    Building2,
    Building
} from "lucide-react";

const BranchPage = () => {
    const [search, setSearch] = useState("");
    const { data: deptData, isLoading } = useDepartments({ search });

    const departments = deptData?.data || [];

    return (
        <div className="w-full flex flex-col font-sans">

            <div className={styles.dashboardHeader}>
                <div className={styles.headerLeft}>

                    <div className={styles.headerIcon}>
                        <Building2 />
                    </div>

                    <div className={styles.headerText}>
                        <h2>Academic Departments & Faculties</h2>

                        <p>
                            View and manage all institutional departments and academic faculties from one central dashboard.
                        </p>
                    </div>

                </div>

                <div className={styles.staffHeader}>
                    <div className={styles.searchInput}>
                        <input 
                            className={styles.input}
                            type="text"
                            placeholder="Search department by name or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className={styles.addNew}>
                        <SquarePlus />
                        <Link href="/admin/dashboard/department">ADD DEPARTMENT</Link>
                    </div>

                </div>
            </div>

            <div className={tableStyles.dashboardWrapper}>
                <div className={tableStyles.dashboardWrapperInner}>

                    <div className={tableStyles.tableContentDiv}>
                        {/* Table Header */}
                        <div className={tableStyles.icon}>
                            <span className="text-(--secondary-color)">
                                <Building size={18} />
                            </span>

                            <span>Academic Departments ({departments.length})</span>
                        </div>

                        <div className={tableStyles.tableContentDivInner}>
                            <table className={tableStyles.table}>
                                <thead>
                                    <tr>
                                        <th>SN</th>
                                        <th>Department Code</th>
                                        <th>Department Name</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-6 text-xs text-gray-400">
                                                Loading department records from database...
                                            </td>
                                        </tr>
                                    ) : departments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-6 text-xs text-gray-400">
                                                No department records found in database.
                                            </td>
                                        </tr>
                                    ) : (
                                        departments.map((dept: any, index: number) => (
                                            <tr key={dept.id}>
                                                <td>{index + 1}</td>
                                                <td className="font-bold text-gray-800">{dept.code}</td>
                                                <td className="font-semibold text-gray-700">{dept.name}</td>
                                                <td>
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                                        dept.status === 'ACTIVE'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    }`}>
                                                        {dept.status || 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td className={tableStyles.view}>
                                                    <Link href="/admin/dashboard/department">
                                                        <span>MANAGE</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BranchPage;