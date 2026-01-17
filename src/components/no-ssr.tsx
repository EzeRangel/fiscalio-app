import dynamic from "next/dynamic";
import React, { FC, PropsWithChildren } from "react";

const NoSsr: FC<PropsWithChildren> = (props) => (
  <React.Fragment>{props.children}</React.Fragment>
);

export default dynamic(() => Promise.resolve(NoSsr), {
  ssr: false,
}) as typeof NoSsr;
