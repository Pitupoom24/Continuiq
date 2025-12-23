import Sidebar from "./components/sidebar";
import Workspace from "./components/workspace";

export default function Home() {

  return (<>
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950">
      <Sidebar />
      <Workspace />
    </div>
  </>
  );
}