import { useQuery } from "@apollo/client";
import { useState } from "react";
import { Badge, Button, Card } from "erxes-ui";
import { gql } from "~/gql";

const QUIZZES_QUERY = gql(`
  query quizList($page: Int, $perPage: Int) {
    quizzes(page: $page, perPage: $perPage) {
      _id
      title
      description
      subject
      grade
      passingScore
      status
      createdAt
    }
  }
`);

export const Samples = () => {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useQuery(QUIZZES_QUERY, {
    variables: { page, perPage: 10 },
  });
  const records = data?.quizzes ?? [];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Quizzes & Assessments</Card.Title>
        <Card.Description>
          AI-generated exams from course materials using Gemma 4.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <p role="status">Loading quizzes…</p>
        ) : error ? (
          <div role="alert">
            <p className="quiz:text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : records.length === 0 ? (
          <p className="quiz:text-muted-foreground">No quizzes created yet. Generate one above!</p>
        ) : (
          <div className="quiz:flex quiz:flex-col quiz:gap-3">
            {records.map((quiz) => (
              <div
                key={quiz?._id}
                className="quiz:flex quiz:items-center quiz:justify-between quiz:rounded-lg quiz:border quiz:p-3"
              >
                <div>
                  <h4 className="quiz:font-medium">{quiz?.title}</h4>
                  <p className="quiz:text-xs quiz:text-muted-foreground">
                    Subject: {quiz?.subject || "General"} · Pass mark: {quiz?.passingScore}%
                  </p>
                </div>
                <Badge variant={quiz?.status === "active" ? "success" : "default"}>
                  {quiz?.status || "active"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="quiz:mt-4 quiz:flex quiz:gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || records.length < 10}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
};
