import Button from "@/components/Button";
import { formatDistanceToNow } from "date-fns";
import useCloudManagerEnvBackupsQuery from "@/hooks/useCloudManagerEnvBackupsQuery";
import useCloudManagerEnvPreviewMutation from "@/hooks/useCloudManagerEnvPreviewMutation";

export default function CloudEnvBackups({ onReview }) {
  const query = useCloudManagerEnvBackupsQuery();
  const previewMutation = useCloudManagerEnvPreviewMutation();

  /** Preview restoring a backup */
  const restore = async (backup) => {
    const preview = await previewMutation
      .mutateAsync({ backup })
      .catch(() => null);

    if (preview) onReview({ backup }, preview);
  };

  if (query.isError) {
    return (
      <p className="p-4 text-center text-red-500">
        Error: {query.error.message}
      </p>
    );
  }

  if (!query.isSuccess) {
    return <p className="p-4 text-center text-orange-500">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-neutral-500 dark:text-neutral-400">
        A backup is saved before every change. The last 10 are kept.
      </p>

      {query.data.length ? (
        query.data.map((backup) => (
          <div
            key={backup.name}
            className="flex items-center gap-2 p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700"
          >
            <div className="min-w-0 grow">
              <p className="font-bold">
                {formatDistanceToNow(new Date(backup.createdAt), {
                  addSuffix: true,
                })}
              </p>
              <p className="text-xs truncate text-neutral-500 dark:text-neutral-400">
                {new Date(backup.createdAt).toLocaleString()}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={() => restore(backup.name)}
              disabled={previewMutation.isPending}
            >
              Restore
            </Button>
          </div>
        ))
      ) : (
        <p className="p-4 text-center text-neutral-500">No backups yet.</p>
      )}
    </div>
  );
}
