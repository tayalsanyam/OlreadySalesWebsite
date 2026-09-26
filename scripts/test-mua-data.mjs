/** QA catalog: 15 published MUAs, 10 featured, 7 cities. IDs are stable for push/remove. */
export const TEST_MUA_IDS=[
 '00000000-0000-4000-b001-000000000001','00000000-0000-4000-b001-000000000002','00000000-0000-4000-b001-000000000003',
 '00000000-0000-4000-b001-000000000004','00000000-0000-4000-b001-000000000005','00000000-0000-4000-b001-000000000006',
 '00000000-0000-4000-b001-000000000007','00000000-0000-4000-b001-000000000008','00000000-0000-4000-b001-000000000009',
 '00000000-0000-4000-b001-000000000010','00000000-0000-4000-b001-000000000011','00000000-0000-4000-b001-000000000012',
 '00000000-0000-4000-b001-000000000013','00000000-0000-4000-b001-000000000014','00000000-0000-4000-b001-000000000015',
];
const expires='2099-12-31T23:59:00+05:30';
const base={image:'/hero.png',profileUrl:'https://merchant.olready.in/makeup/login',definition:'Gross booking value',period:'Q1 2026',evidence:'Internal QA test record',consent:true,approved:true,expires,video:'',poster:'',transcript:'',gallery:[]};
const rows=[
 ['00000000-0000-4000-b001-000000000001','ananya-kapoor-mumbai-mua','Ananya Kapoor','Mumbai','Bridal and reception specialist known for soft glam and long-wear base.','@ananya.mua.bridal',['Bridal makeup','Reception glam'],true,7200000],
 ['00000000-0000-4000-b001-000000000002','priya-sharma-delhi-mua','Priya Sharma','Delhi','HD and airbrush artist for North Indian weddings and editorial shoots.','@priyasharmamua',['HD makeup','Airbrush makeup'],true,9100000],
 ['00000000-0000-4000-b001-000000000003','meera-nair-bangalore-mua','Meera Nair','Bangalore','South Indian bridal looks with classic kemp and contemporary dewy skin.','@meeranair.mua',['Bridal makeup','Traditional bridal'],true,6800000],
 ['00000000-0000-4000-b001-000000000004','simran-kaur-ludhiana-mua','Simran Kaur','Ludhiana','Punjabi bridal expert: bold eyes, flawless base, on-location teams.','@simranbridal',['Bridal makeup','Party glam'],true,5400000],
 ['00000000-0000-4000-b001-000000000005','kavya-reddy-hyderabad-mua','Kavya Reddy','Hyderabad','Telugu and Hyderabadi bridal with elegant nude-gold palettes.','@kavyareddymua',['Bridal makeup','Engagement makeup'],true,6200000],
 ['00000000-0000-4000-b001-000000000006','neha-verma-jaipur-mua','Neha Verma','Jaipur','Destination wedding MUA for palace venues and mehendi mornings.','@nehaverma.jaipur',['Bridal makeup','Mehendi look'],true,5900000],
 ['00000000-0000-4000-b001-000000000007','ritika-sen-chennai-mua','Ritika Sen','Chennai','Tamil bridal and cinema-inspired glam with skin-first prep.','@ritikasen.mua',['Bridal makeup','Cinematic glam'],true,5100000],
 ['00000000-0000-4000-b001-000000000008','diya-malhotra-mumbai-mua','Diya Malhotra','Mumbai','Sangeet and cocktail specialist; glitter, lashes, and quick changes.','@diyamalhotra',['Party glam','Sangeet makeup'],true,4800000],
 ['00000000-0000-4000-b001-000000000009','aisha-khan-delhi-mua','Aisha Khan','Delhi','Muslim and Indo-western bridal with modest, photo-ready finishes.','@aishakhan.mua',['Bridal makeup','Indo-western'],true,7700000],
 ['00000000-0000-4000-b001-000000000010','tanya-iyer-bangalore-mua','Tanya Iyer','Bangalore','Corporate and cocktail MUA; clean lines and neutral tones.','@tanyaiyer.mua',['Party glam','Corporate makeup'],true,4300000],
 ['00000000-0000-4000-b001-000000000011','manpreet-gill-ludhiana-mua','Manpreet Gill','Ludhiana','SEO-only test profile: published, not on public grids.','@manpreet.gill',['Bridal makeup'],false,null],
 ['00000000-0000-4000-b001-000000000012','radhika-patel-jaipur-mua','Radhika Patel','Jaipur','Published for direct links and search; not featured on listings.','@radhika.patel',['Bridal makeup','Engagement makeup'],false,null],
 ['00000000-0000-4000-b001-000000000013','sonal-mehta-hyderabad-mua','Sonal Mehta','Hyderabad','Portfolio and bio live; featured strip and TGA listing off.','@sonal.mehta',['HD makeup'],false,null],
 ['00000000-0000-4000-b001-000000000014','ishita-rao-mumbai-mua','Ishita Rao','Mumbai','Test artist for slug and profile QA without homepage visibility.','@ishita.rao',['Party glam'],false,null],
 ['00000000-0000-4000-b001-000000000015','pooja-agarwal-delhi-mua','Pooja Agarwal','Delhi','Non-featured published MUA for sitemap and profile page checks.','@pooja.agarwal',['Bridal makeup','Airbrush makeup'],false,null],
];
export function testMuaArtists(){
 return rows.map(([id,slug,name,city,bio,instagram,services,featured,amountPaise])=>({
  ...base,id,slug,name,city,bio,instagram,keywords:`makeup artist ${city}, MUA ${city}`,services,
  featuredTopGrossing:featured,
  amountPaise:featured?amountPaise:null,
  definition:featured?base.definition:'',
  period:featured?base.period:'',
  evidence:featured?base.evidence:'',
 }));
}
