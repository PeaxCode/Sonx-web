import { redirect } from "next/navigation";

// AI music video is hidden pending payment provider review (photo uploads).
// next.config.ts redirects /video before render; this is the fallback.
// To bring it back, restore the page below and remove both redirects.
//
// import { CreateVideoForm } from "@/components/studio/create-video-form";
// import { VideoList } from "@/components/studio/video-list";
//
// export const metadata = { title: "Create a music video", alternates: { canonical: "/video" } };
//
// export default function VideoPage() {
//   return (
//     <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:py-12">
//       <section aria-labelledby="video-title">
//         <h1 id="video-title" className="mb-2 font-display text-2xl font-semibold">Create a music video</h1>
//         <p className="mb-6 text-fog">Your photo sings along to a song you pick.</p>
//         <CreateVideoForm />
//       </section>
//       <section aria-labelledby="videos-title">
//         <VideoList />
//       </section>
//     </div>
//   );
// }

export default function VideoPage() {
  redirect("/create");
}
