import { Compass } from "lucide-react";

import { StatusPage } from "@/components/app/status-page";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusPage
      icon={Compass}
      title="Nothing lives at this address"
      body="The link may have been cut short on its way to you, or whatever was here has been deleted."
    >
      <ButtonLink href="/" variant="secondary">
        Back to Lattice
      </ButtonLink>
    </StatusPage>
  );
}
