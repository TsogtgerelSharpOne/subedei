import { useQuery } from "@apollo/client";
import type { ComponentType, ReactNode } from "react";
import {
  IconBook,
  IconBrain,
  IconDatabase,
  IconExternalLink,
  IconLayoutDashboard,
  IconSettings,
} from "@tabler/icons-react";
// Root imports on purpose: core-ui shares `erxes-ui`/`ui-modules` as Module
// Federation singletons keyed on the bare specifier, so deep imports would
// bundle second private copies instead of reusing the host's.
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Separator,
  Skeleton,
  cn,
} from "erxes-ui";
import { PageHeader } from "ui-modules";
import { Link } from "react-router";
import manifest from "../../../erxes.json" with { type: "json" };
import { STATUS_QUERY } from "../graphql";
import { Samples } from "../Samples";

const { path } = manifest.ui;

const Dot = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "quiz:inline-block quiz:size-2 quiz:rounded-full",
      className,
    )}
  />
);

const StatusRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="quiz:flex quiz:items-center quiz:justify-between quiz:gap-4 quiz:text-sm">
    <span className="quiz:text-muted-foreground">{label}</span>
    <span className="quiz:flex quiz:items-center quiz:gap-2 quiz:font-medium">
      {children}
    </span>
  </div>
);

const ConnectionCard = () => {
  const { data, loading, error, refetch } = useQuery(STATUS_QUERY);
  const status = data?.quizStatus;

  const pending = (
    <>
      <Dot className="quiz:animate-pulse quiz:bg-muted-foreground" />
      <Skeleton className="quiz:h-4 quiz:w-24" />
    </>
  );

  return (
    <Card className="quiz:w-full quiz:md:w-80 quiz:shrink-0">
      <Card.Header>
        <Card.Title className="quiz:text-sm">Connection</Card.Title>
        <Card.Description>
          Live status of this plugin inside erxes
        </Card.Description>
      </Card.Header>
      <Card.Content className="quiz:flex quiz:flex-col quiz:gap-3">
        <StatusRow label="API">
          {loading ? (
            pending
          ) : error ? (
            <>
              <Dot className="quiz:bg-destructive" />
              <span>Unreachable</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </>
          ) : (
            <>
              <Dot className="quiz:bg-success" />
              <span>Connected · v{status?.version}</span>
            </>
          )}
        </StatusRow>
        <StatusRow label="Gateway">
          {loading ? (
            pending
          ) : error ? (
            <>
              <Dot className="quiz:bg-destructive" />
              <span
                className="quiz:truncate quiz:max-w-40"
                title={error.message}
              >
                {error.message}
              </span>
            </>
          ) : (
            <>
              <Dot className="quiz:bg-success" />
              <span>Federated as {status?.plugin}</span>
            </>
          )}
        </StatusRow>
        <StatusRow label="Tenant">
          {loading ? pending : (status?.subdomain ?? "—")}
        </StatusRow>
        <StatusRow label="Signed in">
          {loading
            ? pending
            : (status && (status.userEmail ?? status.userId ?? "Anonymous")) ||
              "—"}
        </StatusRow>
      </Card.Content>
    </Card>
  );
};

const StepCard = ({
  icon: Icon,
  title,
  description,
  code,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  code: string;
}) => (
  <Card>
    <Card.Header>
      <div className="quiz:flex quiz:size-9 quiz:items-center quiz:justify-center quiz:rounded-lg quiz:bg-accent">
        <Icon className="quiz:size-5" />
      </div>
      <Card.Title>{title}</Card.Title>
      <Card.Description>{description}</Card.Description>
    </Card.Header>
    <Card.Content>
      <code className="quiz:rounded quiz:bg-muted quiz:px-1.5 quiz:py-0.5 quiz:font-mono quiz:text-xs">
        {code}
      </code>
    </Card.Content>
  </Card>
);

const STEPS = [
  {
    icon: IconDatabase,
    title: "Model your data",
    description:
      "Define the records this plugin owns and expose them on the federated graph.",
    code: "api/src/modules/sample",
  },
  {
    icon: IconLayoutDashboard,
    title: "Build the page",
    description:
      "Replace this overview with your module: lists with RecordTable, forms with Form, details in a Sheet.",
    code: "ui/src/pages/IndexPage.tsx",
  },
];

export const IndexPage = () => (
  <div className="quiz:flex quiz:h-full quiz:flex-col">
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="quiz:gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={`/${path}`}>
                  <IconBrain />
                  {manifest.title}
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Separator.Inline />
        <PageHeader.FavoriteToggleButton
          breadcrumb={[manifest.title]}
          icon="IconBrain"
        />
      </PageHeader.Start>
      <PageHeader.End>
        <Button variant="outline" asChild>
          <Link to={`/${path}/settings`}>
            <IconSettings />
            Settings
          </Link>
        </Button>
      </PageHeader.End>
    </PageHeader>
    <div className="quiz:flex-1 quiz:overflow-auto">
      <div className="quiz:mx-auto quiz:flex quiz:w-full quiz:max-w-5xl quiz:flex-col quiz:gap-6 quiz:p-6">
        <section className="quiz:relative quiz:overflow-hidden quiz:rounded-xl quiz:border quiz:border-border quiz:bg-background quiz:p-8 quiz:shadow-xs">
          <div
            aria-hidden
            className="quiz:pointer-events-none quiz:absolute quiz:inset-0 quiz:bg-gradient-to-br quiz:from-primary/10 quiz:via-transparent quiz:to-transparent"
          />
          <div className="quiz:relative quiz:flex quiz:flex-col quiz:gap-6 quiz:md:flex-row quiz:md:items-start quiz:md:justify-between">
            <div className="quiz:flex quiz:max-w-xl quiz:flex-col quiz:gap-4">
              <div>
                <Badge variant="info">Plugin · v{manifest.version}</Badge>
              </div>
              <h1 className="quiz:text-2xl quiz:font-semibold quiz:tracking-tight">
                Welcome to {manifest.title}
              </h1>
              <p className="quiz:text-sm quiz:leading-relaxed quiz:text-muted-foreground">
                {manifest.description}
              </p>
              <div className="quiz:flex quiz:flex-wrap quiz:gap-2">
                <Button asChild>
                  <Link to={`/${path}/settings`}>
                    <IconSettings />
                    Open settings
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://erxes.io/docs/create-plugin-standalone"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IconBook />
                    Developer guide
                    <IconExternalLink />
                  </a>
                </Button>
              </div>
            </div>
            <ConnectionCard />
          </div>
        </section>
        <Samples />
        <div className="quiz:grid quiz:gap-4 quiz:md:grid-cols-2">
          {STEPS.map((step) => (
            <StepCard key={step.title} {...step} />
          ))}
        </div>
      </div>
    </div>
  </div>
);
