export type PathologyVideo = { url: string; embedUrl: string; poster: string; posterDisplay?: string; posterBlur?: string; title?: string };

function drive(id: string, folder: string, preview: string, title?: string): PathologyVideo {
  return {
    url: `https://drive.google.com/file/d/${id}/view?usp=drive_link`,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
    poster: `/patologias/${encodeURIComponent(folder)}/${encodeURIComponent(preview)}.poster.webp`,
    ...(title ? { title } : {}),
  };
}

// Links supplied by the collection owner. The first four deliberately share
// the supplied ID; keep them unchanged until the owner provides corrections.
export const pathologyVideos: Record<string, PathologyVideo[]> = {
  "amelia-parcial-anterior-y-anuro-en-vacuno": [drive("1H6uQv44ar0HRntoJBe40-IUwA3IiOVv5", "amelia-parcial-anterior-y-anuro-en-vacuno", "video-1.mp4.web.mp4")],
  "anotia-en-conejo": [drive("1H6uQv44ar0HRntoJBe40-IUwA3IiOVv5", "anotia-en-conejo", "video-1.mp4.web.mp4")],
  "anuro-en-asno": [drive("1H6uQv44ar0HRntoJBe40-IUwA3IiOVv5", "anuro-en-asno", "video-1.wmv.web.mp4")],
  "atresia-anal-y-amelia-posterior": [drive("1H6uQv44ar0HRntoJBe40-IUwA3IiOVv5", "atresia-anal-y-amelia-posterior", "video-1.avi.web.mp4")],
  "craneotoracopago-en-cuy-2": [drive("1GYL1CBo1L1kPpfxVQtcOqnkNhc1Ss7GK", "craneotoracópago-en-cuy-2", "video-1.mp4.web.mp4")],
  "diprosopia-parcial-en-ovino": [
    drive("1LhZfy9y6qLqd7nIHmBdmHKDiC_1YzDn_", "diprosopia-parcial-en-ovino", "video-1.wmv.web.mp4", "Caso clínico · fotografías"),
    drive("1S8gYs-HJg5MlRsJoVeBYmMRle9TEa3nj", "diprosopia-parcial-en-ovino", "video-2.wmv.web.mp4", "Caso clínico"),
  ],
  "escoliosis-en-ovino": [drive("1v5ov53wqc1nJP3H7DX0gYn9dvdsTcZG1", "escoliosis-en-ovino", "video-1.wmv.web.mp4")],
  "escoliosis-ovina-ii": [drive("1G7ierNgwryMIj2vV8yNKtK6H56qTphJ6", "escoliosis-ovina-ii", "video-1.wmv.web.mp4")],
  "hipospadia-en-ovino": [
    drive("1t7mK7iXQ_LubywMgcdNdMgXAn8zJ5FcK", "hipospadia-en-ovino", "video-1.mts.web.mp4"),
    drive("1HP35n0cMquuvaMezcZs-zjrsCEaHPjAo", "hipospadia-en-ovino", "video-2.mts.web.mp4"),
    drive("1onySUDGBD-dSe4n8Lc4m1iYT2aLuHmeY", "hipospadia-en-ovino", "video-3.mts.web.mp4"),
    drive("1SzeZW1i8pjAeW7RhA7PcL4M45eYpLqPb", "hipospadia-en-ovino", "video-4.mov.web.mp4"),
  ],
  "momificacion-fetal": [drive("1EdxJuUctdqY3iQdKnZGq9uDs7c67A_-J", "momificación-fetal", "video-1.mp4.web.mp4")],
  "pie-zambo-en-cuy": [drive("1w3Wqiu7ccM35aqKy3cntwBIB9mkpE1Os", "pie-zambo-en-cuy", "video-1.wmv.web.mp4")],
  "queratomeningocele": [drive("1exVN5EWUZ3yf1-8xmQb-OEVqqLVbCd1r", "queratomeningocele", "video-1.wmv.web.mp4")],
  "sindrome-de-prune-belly": [drive("1Ke0HULf6grl1BJnqfbXOZJjDntWYRlX6", "síndrome-de-prune-belly", "video-1.mp4.web.mp4")],
};
