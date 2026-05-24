import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "~/components/shell/admin-shell";
import messages from "~/messages/zh-cn.json";

export const metadata: Metadata = {
  title: `${messages.Admin.title} - ${messages.Metadata.siteName}`,
  description: messages.Metadata.adminDescription,
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
