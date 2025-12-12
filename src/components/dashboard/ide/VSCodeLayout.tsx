import { VSCodeInterface } from "./VSCodeInterface";

interface VSCodeLayoutProps {
  project: {
    id: string;
    name: string;
    owner?: string;
    repo?: string;
    branch?: string;
    status: "crashed" | "resurrected" | "fixing" | "pending" | "deployed" | "building" | "failed" | "offline";
    errorPreview?: string;
    latestDeploymentId?: string;
  };
  onClose: () => void;
}

export function VSCodeLayout({ project, onClose }: VSCodeLayoutProps) {
  return <VSCodeInterface project={project} onClose={onClose} />;
}