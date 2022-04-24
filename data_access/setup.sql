create schema if not exists findnearbyplaces;

drop table if exists findnearbyplaces.category;
drop table if exists findnearbyplaces.customer;
drop table if exists findnearbyplaces.place;
drop table if exists findnearbyplaces.review;
drop table if exists findnearbyplaces.photo;
drop table if exists findnearbyplaces.place_photo;
drop table if exists findnearbyplaces.review_photo;

create table findnearbyplaces.category
(
	id serial primary key,
	name varchar(256) not null
);

create table findnearbyplaces.customer
(
	id serial primary key,
	email varchar(256) not null,
	password varchar(60) not null
);

create table findnearbyplaces.place
(
	id bigserial primary key unique,
	name varchar(256) not null,
	latitude bigint not null,
	longitude bigint not null,
	description varchar(512) not null,
	category_id int references findnearbyplaces.category(id),
	customer_id int references findnearbyplaces.customer(id)
);

create table findnearbyplaces.review 
(
	location_id bigserial primary key,
	customer_id int references findnearbyplaces.customer(id),
	id serial not null unique,
	text varchar(256) not null,
	rating bit[1] not null
);

create table findnearbyplaces.photo 
(
	id serial primary key,
	file bytea not null
);

create table findnearbyplaces.place_photo
(
	location_id int8 references findnearbyplaces.review(location_id),
	photo_id int not null
);

create table findnearbyplaces.review_photo
(
	review_id int references findnearbyplaces.review(id),
	photo_id int not null
);


