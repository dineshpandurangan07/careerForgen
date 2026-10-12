import type { ReactNode } from "react";
import { RoleSelect } from "./RoleSelect";

export function PageHead({ title, sub, role = true }: { title: ReactNode; sub?: ReactNode; role?: boolean }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {sub !== undefined && <p>{sub}</p>}
      </div>
      {role && (
        <div>
          <RoleSelect />
        </div>
      )}
    </div>
  );
}
