-- Demo data only. The rectangles are illustrative, not legal boundaries.
-- Remove only prior demo records, including rows from the earlier seed format.
delete from public.parcels
where (owner_name, village) in (
  ('R. Meenakshi / ஆர். மீனாட்சி', 'Perungudi'),
  ('K. Arul / கே. அருள்', 'Perungudi'),
  ('S. Kavitha / எஸ். கவிதா', 'Thondamuthur'),
  ('P. Saravanan / பி. சரவணன்', 'Vadavalli'),
  ('M. Selvi / எம். செல்வி', 'Avaniyapuram'),
  ('V. Karthik / வி. கார்த்திக்', 'Anna Nagar'),
  ('A. Revathi / ஏ. ரேவதி', 'Srirangam'),
  ('D. Prakash / டி. பிரகாஷ்', 'Kattur'),
  ('L. Yazhini / எல். யாழினி', 'Singanallur'),
  ('J. Aravind / ஜே. அரவிந்த்', 'Thirunagar')
);

insert into public.parcels (
  survey_no, village, taluk, district, area_sqm, land_type, owner_name, status, geojson
) values
('123/4A','Perungudi','Sholinganallur','Chennai',120,'Residential','R. Meenakshi / ஆர். மீனாட்சி','verified','{"type":"Polygon","coordinates":[[[80.21995,12.94995],[80.22005,12.94995],[80.22005,12.95005],[80.21995,12.95005],[80.21995,12.94995]]]}'),
('123/4B','Perungudi','Sholinganallur','Chennai',120,'Residential','K. Arul / கே. அருள்','pending','{"type":"Polygon","coordinates":[[[80.21999,12.94999],[80.22009,12.94999],[80.22009,12.95009],[80.21999,12.95009],[80.21999,12.94999]]]}'),
('88/2C','Thondamuthur','Coimbatore South','Coimbatore',180,'Agricultural','S. Kavitha / எஸ். கவிதா','verified','{"type":"Polygon","coordinates":[[[76.93594,10.99394],[76.93606,10.99394],[76.93606,10.99406],[76.93594,10.99406],[76.93594,10.99394]]]}'),
('45/1A','Vadavalli','Coimbatore North','Coimbatore',150,'Residential','P. Saravanan / பி. சரவணன்','verified','{"type":"Polygon","coordinates":[[[76.90995,11.03995],[76.91005,11.03995],[76.91005,11.04005],[76.90995,11.04005],[76.90995,11.03995]]]}'),
('210/3B','Avaniyapuram','Thirupparankundram','Madurai',200,'Agricultural','M. Selvi / எம். செல்வி','disputed','{"type":"Polygon","coordinates":[[[78.11294,9.86994],[78.11306,9.86994],[78.11306,9.87006],[78.11294,9.87006],[78.11294,9.86994]]]}'),
('67/5','Anna Nagar','Madurai North','Madurai',135,'Residential','V. Karthik / வி. கார்த்திக்','verified','{"type":"Polygon","coordinates":[[[78.14495,9.93995],[78.14505,9.93995],[78.14505,9.94005],[78.14495,9.94005],[78.14495,9.93995]]]}'),
('302/2A','Srirangam','Srirangam','Tiruchirappalli',165,'Residential','A. Revathi / ஏ. ரேவதி','verified','{"type":"Polygon","coordinates":[[[78.68994,10.86194],[78.69006,10.86194],[78.69006,10.86206],[78.68994,10.86206],[78.68994,10.86194]]]}'),
('19/7C','Kattur','Thiruverumbur','Tiruchirappalli',240,'Agricultural','D. Prakash / டி. பிரகாஷ்','under_review','{"type":"Polygon","coordinates":[[[78.77994,10.78994],[78.78006,10.78994],[78.78006,10.79006],[78.77994,10.79006],[78.77994,10.78994]]]}'),
('156/1D','Singanallur','Coimbatore South','Coimbatore',110,'Residential','L. Yazhini / எல். யாழினி','verified','{"type":"Polygon","coordinates":[[[77.00995,10.99995],[77.01005,10.99995],[77.01005,11.00005],[77.00995,11.00005],[77.00995,10.99995]]]}'),
('74/6A','Thirunagar','Thirupparankundram','Madurai',190,'Agricultural','J. Aravind / ஜே. அரவிந்த்','verified','{"type":"Polygon","coordinates":[[[78.07494,9.89994],[78.07506,9.89994],[78.07506,9.90006],[78.07494,9.90006],[78.07494,9.89994]]]}');

insert into public.ownership_history (parcel_id, owner_name, transfer_type, from_year, to_year)
select p.id, h.owner_name, h.transfer_type::public.ownership_transfer_type, h.from_year, h.to_year
from (values
  ('123/4A','Perungudi','P. Raman / பி. ராமன்','original',1970,1990), ('123/4A','Perungudi','S. Kumar / எஸ். குமார்','sale',1990,2010), ('123/4A','Perungudi','R. Meenakshi / ஆர். மீனாட்சி','inheritance',2010,null),
  ('123/4B','Perungudi','M. Lakshmi / எம். லட்சுமி','original',1972,1992), ('123/4B','Perungudi','R. Selvam / ஆர். செல்வம்','sale',1992,2012), ('123/4B','Perungudi','K. Arul / கே. அருள்','inheritance',2012,null),
  ('88/2C','Thondamuthur','K. Marimuthu / கே. மாரிமுத்து','original',1975,1995), ('88/2C','Thondamuthur','S. Balan / எஸ். பாலன்','sale',1995,2015), ('88/2C','Thondamuthur','S. Kavitha / எஸ். கவிதா','inheritance',2015,null),
  ('45/1A','Vadavalli','R. Gopal / ஆர். கோபால்','original',1978,1998), ('45/1A','Vadavalli','P. Nila / பி. நிலா','sale',1998,2018), ('45/1A','Vadavalli','P. Saravanan / பி. சரவணன்','inheritance',2018,null),
  ('210/3B','Avaniyapuram','A. Muthu / ஏ. முத்து','original',1970,1990), ('210/3B','Avaniyapuram','K. Rani / கே. ராணி','sale',1990,2010), ('210/3B','Avaniyapuram','M. Selvi / எம். செல்வி','inheritance',2010,null),
  ('67/5','Anna Nagar','T. Chidambaram / டி. சிதம்பரம்','original',1980,2000), ('67/5','Anna Nagar','V. Uma / வி. உமா','sale',2000,2018), ('67/5','Anna Nagar','V. Karthik / வி. கார்த்திக்','inheritance',2018,null),
  ('302/2A','Srirangam','N. Krishnan / என். கிருஷ்ணன்','original',1975,1995), ('302/2A','Srirangam','A. Guna / ஏ. குணா','sale',1995,2015), ('302/2A','Srirangam','A. Revathi / ஏ. ரேவதி','inheritance',2015,null),
  ('19/7C','Kattur','P. Mani / பி. மணி','original',1972,1992), ('19/7C','Kattur','D. Vasantha / டி. வசந்தா','sale',1992,2012), ('19/7C','Kattur','D. Prakash / டி. பிரகாஷ்','inheritance',2012,null),
  ('156/1D','Singanallur','S. Raju / எஸ். ராஜு','original',1982,2002), ('156/1D','Singanallur','L. Malar / எல். மலர்','sale',2002,2020), ('156/1D','Singanallur','L. Yazhini / எல். யாழினி','inheritance',2020,null),
  ('74/6A','Thirunagar','P. Kannan / பி. கண்ணன்','original',1976,1996), ('74/6A','Thirunagar','J. Indira / ஜே. இந்திரா','sale',1996,2016), ('74/6A','Thirunagar','J. Aravind / ஜே. அரவிந்த்','inheritance',2016,null)
) as h(survey_no, village, owner_name, transfer_type, from_year, to_year)
join public.parcels p on p.survey_no = h.survey_no and p.village = h.village;

insert into public.encumbrances (parcel_id, kind, details, status)
select p.id, e.kind, e.details::jsonb, 'active'
from (values
  ('210/3B','Avaniyapuram','litigation','{"case":"Demo civil dispute","court":"Madurai District Court"}'),
  ('88/2C','Thondamuthur','mortgage','{"lender":"Demo Cooperative Bank"}')
) as e(survey_no, village, kind, details)
join public.parcels p on p.survey_no = e.survey_no and p.village = e.village;

insert into public.tax_records (parcel_id, year, amount, paid, paid_on)
select p.id, t.year, t.amount, t.paid, t.paid_on::date
from (values
  ('123/4A','Perungudi',2024,1850,true,'2024-06-15'),
  ('123/4A','Perungudi',2025,1920,true,'2025-06-12'),
  ('210/3B','Avaniyapuram',2025,1240,false,null),
  ('19/7C','Kattur',2025,980,true,'2025-07-03')
) as t(survey_no, village, year, amount, paid, paid_on)
join public.parcels p on p.survey_no = t.survey_no and p.village = t.village;
