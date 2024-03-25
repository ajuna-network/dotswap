import AssetsTable from "../../components/organism/AssetsTable";

const DashboardPage = () => {
  return (
    <div className="flex h-full w-full flex-col px-6 py-8">
      <div className="flex h-full flex-col gap-6">
        <AssetsTable />
      </div>
    </div>
  );
};
export default DashboardPage;
