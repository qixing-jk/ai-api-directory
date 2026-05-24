import type { ComponentProps } from "react";
import { Link as IntlLink } from "~/i18n/navigation";

type AppLinkProps = ComponentProps<typeof IntlLink>;

export function AppLink(props: AppLinkProps) {
  return <IntlLink {...props} />;
}
