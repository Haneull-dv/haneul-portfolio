import Layout from "@/shared/components/Layout/Layout"; // Layout 컴포넌트의 실제 경로

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}