import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import YouTube from 'react-youtube';
import type { YouTubeEvent, YouTubePlayer } from 'react-youtube';
import { useLesson } from '../../api/hooks/useCourses';
import { useTrackLessonProgress } from '../../api/hooks/useLessonProgress';
import { Card } from '../../components/Card';

/** Extracts an 11-char YouTube video ID from any common YouTube URL shape. */
function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const trackProgress = useTrackLessonProgress(lessonId ?? '');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading lesson…</p>;
  }

  if (error || !lesson) {
    return <p className="text-sm text-red-600">Couldn&apos;t load this lesson.</p>;
  }

  const videoId = extractYouTubeId(lesson.video_url);

  function reportProgress(player: YouTubePlayer, completed: boolean) {
    const watchedSeconds = Math.floor(player.getCurrentTime?.() ?? 0);
    trackProgress.mutate({ watched_seconds: watchedSeconds, completed });
  }

  function handleReady(event: YouTubeEvent) {
    // Poll every 15s while the video plays so watched_seconds keeps moving
    // forward even if the student never reaches "ended".
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      reportProgress(event.target, false);
    }, 15000);
  }

  function handleEnd(event: YouTubeEvent) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    reportProgress(event.target, true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{lesson.title}</h1>
        {lesson.estimated_minutes && (
          <p className="mt-1 text-sm text-gray-500">Estimated: {lesson.estimated_minutes} minutes</p>
        )}
      </div>

      {videoId ? (
        <Card className="p-0 overflow-hidden">
          <div className="aspect-video w-full">
            <YouTube
              videoId={videoId}
              className="h-full w-full"
              iframeClassName="h-full w-full"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  start: lesson.video_start_seconds ?? undefined,
                  end: lesson.video_end_seconds ?? undefined,
                },
              }}
              onReady={handleReady}
              onEnd={handleEnd}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-gray-500">This lesson has no video attached.</p>
        </Card>
      )}

      {lesson.content && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Notes</h3>
          <p className="whitespace-pre-line text-sm text-gray-700">{lesson.content}</p>
        </Card>
      )}
    </div>
  );
}
