/* Isolated, fictional design fixture. Never imports or writes application data. */
window.reportFixture = {
  address: 'Sýnigata 24', locality: '101 Reykjavík', unit: 'Íbúð 0201 · 2. hæð',
  inspector: 'Elín Dæmisdóttir', role: 'Fulltrúi leigusala',
  inspectionDate: '16. október 2026', inspectionTime: '10:00–10:45',
  handoverDate: '1. nóvember 2026',
  rooms: [
    { id: 'R01', name: 'Forstofa', scope: 'Sýnilegir fletir og einföld prófun hurðar og ljósa.', items: [
      { id: 'A01', name: 'Gólfefni', condition: 'wear', cleanliness: 'clean', note: 'Grunnar rispur í parketi við þröskuld. Skráð sem eðlileg notkunarmerki; engin niðurstaða um ábyrgð.', photo: null },
      { id: 'A02', name: 'Veggir', condition: 'good', note: 'Engin sýnileg frávik á aðgengilegum flötum.' },
      { id: 'A03', name: 'Hurð og læsing', condition: 'good', functionality: 'works', note: 'Hurð opnuð og lokuð. Læsing prófuð með lykli.' },
      { id: 'A04', name: 'Ljós og rofar', condition: 'good', functionality: 'works', note: 'Ljós kviknuðu við prófun rofa.' }
    ]},
    { id: 'R02', name: 'Eldhús', scope: 'Sýnilegir fletir, skápahurðir og vatnsrennsli. Ofn ekki gangsettur.', overview: 'M01', items: [
      { id: 'A05', name: 'Innréttingar', condition: 'good', functionality: 'works', cleanliness: 'clean', note: 'Hurðir opnaðar og lokaðar. Aðgengilegir fletir hreinir.', photo: 'M01' },
      { id: 'A06', name: 'Borðplata', condition: 'good', cleanliness: 'clean', note: 'Engin sýnileg frávik á aðgengilegum flötum.', change: { condition: 'damaged', type: 'Brot', location: 'Frambrún við vask', note: 'Lítið brot í yfirborði frambrúnar. Undirlag sést. Stærð ekki mæld.', photo: 'M02' } },
      { id: 'A07', name: 'Vaskur og krani', condition: 'good', functionality: 'works', cleanliness: 'clean', note: 'Vatn rann og stöðvaðist við einfalda prófun. Enginn sýnilegur leki meðan prófað var.' },
      { id: 'A08', name: 'Ofn', condition: 'good', functionality: 'untested', cleanliness: 'clean', note: 'Ofn ekki gangsettur. Útlit og aðgengilegir fletir skoðaðir.' },
      { id: 'A09', name: 'Eldhúsvifta', condition: 'good', functionality: 'works', cleanliness: 'clean', note: 'Vifta fór í gang við prófun.', change: { condition: 'defect', functionality: 'broken', cleanliness: 'dirty', type: 'Bilun', location: 'Vifta yfir helluborði', note: 'Vifta fór ekki í gang við prófun rofa. Fita á síu. Orsök óstaðfest.', photo: null } },
      { id: 'A10', name: 'Uppþvottavél', condition: 'na', note: 'Uppþvottavél er ekki til staðar.' }
    ]},
    { id: 'R03', name: 'Baðherbergi', scope: 'Sjónskoðun aðgengilegra flata. Engin rakamæling eða prófun á þéttingu.', items: [
      { id: 'A11', name: 'Gólfefni', condition: 'good', cleanliness: 'clean', note: 'Engin sýnileg frávik á aðgengilegum flötum.' },
      { id: 'A12', name: 'Sturta', condition: 'good', functionality: 'works', cleanliness: 'clean', note: 'Vatnsrennsli prófað. Þétting ekki prófuð.', change: { condition: 'defect', type: 'Laus þétting', location: 'Neðra horn við sturtubotn', note: 'Þéttiefni hefur losnað frá vegg við sturtubotn. Ekki kannað hvort vatn fer um samskeyti.', photo: 'M03' } },
      { id: 'A13', name: 'Loftræsting', condition: 'good', functionality: 'untested', note: 'Loftstreymi ekki mælt. Virkni ekki prófuð.' },
      { id: 'A14', name: 'Sýnileg rakamerki', condition: 'uninspected', note: 'Flötur aftan við fastan skáp var óaðgengilegur. Ekki lagt mat á rakamerki þar.' },
      { id: 'A15', name: 'Loft', note: 'Ástandsmat hefur ekki verið skráð. Engin niðurstaða liggur fyrir.' }
    ]}
  ],
  photos: {
    M01: { src: 'assets/kitchen.png', caption: 'Eldhús · yfirlit og samhengi innréttinga', alt: 'Tilbúin yfirlitsmynd af eldhúsi með hvítum innréttingum og grárri borðplötu.', ref: 'R02 / A05' },
    M02: { src: 'assets/counter.png', caption: 'Borðplata · brot á frambrún við vask', alt: 'Tilbúin nærmynd sýnir brot á grárri frambrún borðplötu við vask.', ref: 'R02 / A06' },
    M03: { src: 'assets/bath.png', caption: 'Sturta · losað þéttiefni við sturtubotn', alt: 'Tilbúin nærmynd af samskeytum sturtubotns og flísaveggjar þar sem þéttiefni hefur losnað.', ref: 'R03 / A12' }
  }
};
