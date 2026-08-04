import { FileQuestion } from "lucide-react";

import { StatusPage } from "@/components/app/status-page";
import { ButtonLink } from "@/components/ui/button";

export function BoardUnavailable({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <StatusPage icon={FileQuestion} title={title} body={body}>
      <ButtonLink href="/dashboard" variant="secondary">
        Back to boards
      </ButtonLink>
    </StatusPage>
  );
}
