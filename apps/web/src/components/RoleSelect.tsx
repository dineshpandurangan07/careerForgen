import { useNavigate } from "react-router-dom";
import { allRoles } from "@careerforge/shared";
import { useStore } from "../context/StoreContext";

export function RoleSelect() {
  const { state, update } = useStore();
  const navigate = useNavigate();
  const roles = allRoles(state);

  return (
    <>
      <label className="note" htmlFor="roleSel">
        Target role
      </label>
      <br />
      <select
        id="roleSel"
        value={state.role}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "__other") {
            navigate("/target");
            return;
          }
          update((s) => {
            s.role = value;
            s.targetSet = true;
          });
        }}
      >
        {Object.entries(roles).map(([key, role]) => (
          <option key={key} value={key}>
            {role.name}
          </option>
        ))}
        <option value="__other">Choose another role…</option>
      </select>
    </>
  );
}
