import { redirect } from "next/navigation";

export default function ViewDepartmentRedirect() {
    redirect("/admin/dashboard/department");
}
