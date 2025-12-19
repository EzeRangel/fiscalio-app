import { ReactNode } from "react";
import { TanstackQueryProvider } from "./providers/tanstack-query-provider";

export default function App({ children }: { children: ReactNode }) {
  return <TanstackQueryProvider>{children}</TanstackQueryProvider>;
}
