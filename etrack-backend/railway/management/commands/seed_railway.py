from django.core.management.base import BaseCommand
from django.db import transaction
from datetime import time

from railway.models import (
    Station,
    Route,
    RouteStop,
    Train,
    TrainService,
    Fare,
)

IMAGE_URL = "https://preview.redd.it/busy-indian-railway-station-scenes-digital-art-v0-kmjtzgl38a7c1.png?width=1024&format=png&auto=webp&s=8fe25e762af5ac2c8172a90859aab415b6999b37"

STATION_COORDS = {
    "MAS": (13.0827, 80.2707),
    "MS": (13.0732, 80.2613),
    "KPD": (12.9698, 79.1386),
    "SA": (11.6643, 78.1460),
    "ED": (11.3410, 77.7172),
    "CBE": (11.0168, 76.9558),
    "TPJ": (10.7905, 78.7047),
    "DG": (10.3673, 77.9803),
    "MDU": (9.9252, 78.1198),
    "CAPE": (8.0883, 77.5385),
    "SBC": (12.9784, 77.5726),
    "YPR": (13.0213, 77.5539),
    "MYS": (12.2958, 76.6394),
    "HYB": (17.3850, 78.4867),
    "SC": (17.4399, 78.4983),
    "BZA": (16.5062, 80.6480),
    "VSKP": (17.6868, 83.2185),
    "TPTY": (13.6288, 79.4192),
    "ERS": (9.9816, 76.2999),
    "TVC": (8.5241, 76.9366),
}

STATIONS_DATA = [
    {"name": "Chennai Central", "code": "MAS", "city": "Chennai", "state": "Tamil Nadu",
     "description": "One of the busiest railway stations in South India connecting major cities across India.",
     "address": "Park Town, Chennai, Tamil Nadu 600003", "hours": "Open - 24 Hours",
     "phone": "044-25353388", "email": "mas@railway.in", "head_of_org": "Station Director - Chennai Central"},
    {"name": "Chennai Egmore", "code": "MS", "city": "Chennai", "state": "Tamil Nadu",
     "description": "Major station serving suburban and long-distance trains in Chennai.",
     "address": "Egmore, Chennai, Tamil Nadu 600008", "hours": "Open - 24 Hours",
     "phone": "044-28194555", "email": "ms@railway.in", "head_of_org": "Station Manager - Chennai Egmore"},
    {"name": "Katpadi Junction", "code": "KPD", "city": "Vellore", "state": "Tamil Nadu",
     "description": "Important junction connecting Chennai with Bengaluru and South Tamil Nadu.",
     "address": "Katpadi, Vellore, Tamil Nadu 632007", "hours": "Open - 24 Hours",
     "phone": "0416-2260000", "email": "kpd@railway.in", "head_of_org": "Station Manager - Katpadi"},
    {"name": "Salem Junction", "code": "SA", "city": "Salem", "state": "Tamil Nadu",
     "description": "Major station serving western Tamil Nadu region.",
     "address": "Salem, Tamil Nadu 636005", "hours": "Open - 24 Hours",
     "phone": "0427-2331155", "email": "sa@railway.in", "head_of_org": "Station Manager - Salem"},
    {"name": "Erode Junction", "code": "ED", "city": "Erode", "state": "Tamil Nadu",
     "description": "Important junction connecting Erode and Coimbatore region.",
     "address": "Erode, Tamil Nadu 638001", "hours": "Open - 24 Hours",
     "phone": "0424-2250301", "email": "ed@railway.in", "head_of_org": "Station Manager - Erode"},
    {"name": "Coimbatore Junction", "code": "CBE", "city": "Coimbatore", "state": "Tamil Nadu",
     "description": "Important station connecting Tamil Nadu and Kerala.",
     "address": "State Bank Road, Coimbatore, Tamil Nadu 641018", "hours": "Open - 24 Hours",
     "phone": "0422-2301301", "email": "cbe@railway.in", "head_of_org": "Station Director - Coimbatore"},
    {"name": "Tiruchirappalli Junction", "code": "TPJ", "city": "Tiruchirappalli", "state": "Tamil Nadu",
     "description": "Key railway junction in central Tamil Nadu.",
     "address": "Tiruchirappalli, Tamil Nadu 620001", "hours": "Open - 24 Hours",
     "phone": "0431-2413360", "email": "tpj@railway.in", "head_of_org": "Station Manager - Trichy"},
    {"name": "Dindigul Junction", "code": "DG", "city": "Dindigul", "state": "Tamil Nadu",
     "description": "Regional junction connecting Madurai and Coimbatore routes.",
     "address": "Dindigul, Tamil Nadu 624001", "hours": "Open - 24 Hours",
     "phone": "0451-2432100", "email": "dg@railway.in", "head_of_org": "Station Manager - Dindigul"},
    {"name": "Madurai Junction", "code": "MDU", "city": "Madurai", "state": "Tamil Nadu",
     "description": "Major junction serving southern Tamil Nadu and pilgrimage travelers.",
     "address": "West Perumal Maistry St, Madurai, Tamil Nadu 625001", "hours": "Open - 24 Hours",
     "phone": "0452-2345678", "email": "mdu@railway.in", "head_of_org": "Station Manager - Madurai"},
    {"name": "Kanyakumari", "code": "CAPE", "city": "Kanyakumari", "state": "Tamil Nadu",
     "description": "Southernmost railway station in India.",
     "address": "Kanyakumari, Tamil Nadu 629702", "hours": "Open - 24 Hours",
     "phone": "04652-246000", "email": "cape@railway.in", "head_of_org": "Station Manager - Kanyakumari"},
    {"name": "Bengaluru City Junction", "code": "SBC", "city": "Bengaluru", "state": "Karnataka",
     "description": "Main railway hub of Karnataka capital city.",
     "address": "Kempegowda Road, Bengaluru, Karnataka 560023", "hours": "Open - 24 Hours",
     "phone": "080-22874567", "email": "sbc@railway.in", "head_of_org": "Station Director - Bengaluru"},
    {"name": "Yeshwantpur", "code": "YPR", "city": "Bengaluru", "state": "Karnataka",
     "description": "Major terminal station in Bengaluru handling long-distance trains.",
     "address": "Yeshwanthpur, Bengaluru, Karnataka 560022", "hours": "Open - 24 Hours",
     "phone": "080-23370000", "email": "ypr@railway.in", "head_of_org": "Station Manager - YPR"},
    {"name": "Mysuru Junction", "code": "MYS", "city": "Mysuru", "state": "Karnataka",
     "description": "Historic railway station serving Mysuru city.",
     "address": "Mysuru, Karnataka 570001", "hours": "Open - 24 Hours",
     "phone": "0821-2421111", "email": "mys@railway.in", "head_of_org": "Station Manager - Mysuru"},
    {"name": "Hyderabad Deccan", "code": "HYB", "city": "Hyderabad", "state": "Telangana",
     "description": "Main railway station of Hyderabad city.",
     "address": "Nampally, Hyderabad, Telangana 500001", "hours": "Open - 24 Hours",
     "phone": "040-23456789", "email": "hyb@railway.in", "head_of_org": "Station Director - Hyderabad"},
    {"name": "Secunderabad Junction", "code": "SC", "city": "Secunderabad", "state": "Telangana",
     "description": "Major railway junction in Telangana.",
     "address": "Secunderabad, Telangana 500003", "hours": "Open - 24 Hours",
     "phone": "040-27786123", "email": "sc@railway.in", "head_of_org": "Station Manager - Secunderabad"},
    {"name": "Vijayawada Junction", "code": "BZA", "city": "Vijayawada", "state": "Andhra Pradesh",
     "description": "Key railway junction in Andhra Pradesh.",
     "address": "Vijayawada, Andhra Pradesh 520001", "hours": "Open - 24 Hours",
     "phone": "0866-2570000", "email": "bza@railway.in", "head_of_org": "Station Director - Vijayawada"},
    {"name": "Visakhapatnam", "code": "VSKP", "city": "Visakhapatnam", "state": "Andhra Pradesh",
     "description": "Major coastal railway station in Andhra Pradesh.",
     "address": "Visakhapatnam, Andhra Pradesh 530004", "hours": "Open - 24 Hours",
     "phone": "0891-2746300", "email": "vskp@railway.in", "head_of_org": "Station Manager - Visakhapatnam"},
    {"name": "Tirupati", "code": "TPTY", "city": "Tirupati", "state": "Andhra Pradesh",
     "description": "Pilgrimage railway station serving Tirumala temple.",
     "address": "Tirupati, Andhra Pradesh 517501", "hours": "Open - 24 Hours",
     "phone": "0877-2233333", "email": "tpty@railway.in", "head_of_org": "Station Director - Tirupati"},
    {"name": "Kochi Ernakulam Junction", "code": "ERS", "city": "Kochi", "state": "Kerala",
     "description": "Main railway station serving Kochi city.",
     "address": "Ernakulam, Kerala 682016", "hours": "Open - 24 Hours",
     "phone": "0484-2395200", "email": "ers@railway.in", "head_of_org": "Station Director - Kochi"},
    {"name": "Thiruvananthapuram Central", "code": "TVC", "city": "Thiruvananthapuram", "state": "Kerala",
     "description": "Capital city railway station of Kerala.",
     "address": "Thiruvananthapuram, Kerala 695001", "hours": "Open - 24 Hours",
     "phone": "0471-2323366", "email": "tvc@railway.in", "head_of_org": "Station Director - TVM"},
]


def mk_t(h, m):
    return time(hour=h, minute=m)


def get_station(code):
    return Station.objects.get(code=code)


def upsert_route(name):
    r, _ = Route.objects.update_or_create(name=name, defaults={"is_active": True})
    return r


def set_route_stops(route, stops):
    # ✅ delete fares referencing this route's stops first (because Fare has PROTECT)
    Fare.objects.filter(from_stop__route=route).delete()
    Fare.objects.filter(to_stop__route=route).delete()

    # ✅ now safe to delete old stops
    RouteStop.objects.filter(route=route).delete()

    for i, s in enumerate(stops, start=1):
        RouteStop.objects.create(
            route=route,
            station=get_station(s["code"]),
            stop_order=i,
            arrival_time=mk_t(*s["arr"]) if s.get("arr") else None,
            departure_time=mk_t(*s["dep"]) if s.get("dep") else None,
            day_offset=s.get("day_offset", 0),
        )


def upsert_train(no, name):
    t, _ = Train.objects.update_or_create(
        train_no=no,
        defaults={"name": name, "is_active": True}
    )
    return t


def upsert_service(train, route, mask=127):
    svc, _ = TrainService.objects.update_or_create(
        train=train,
        route=route,
        defaults={"running_days_mask": mask, "is_active": True},
    )
    return svc


def upsert_fares(service, route, base_first, base_second, base_third):
    # clean fares for this service so reruns are safe
    Fare.objects.filter(service=service).delete()

    stops = list(route.stops.all().order_by("stop_order"))
    for i in range(len(stops) - 1):
        for j in range(i + 1, len(stops)):
            gap = j - i  # proxy distance
            from_stop = stops[i]
            to_stop = stops[j]

            first_amt = base_first + gap * 70
            second_amt = base_second + gap * 45
            third_amt = base_third + gap * 25

            Fare.objects.update_or_create(
                service=service,
                from_stop=from_stop,
                to_stop=to_stop,
                travel_class=Fare.CLASS_FIRST,
                defaults={"amount": first_amt},
            )
            Fare.objects.update_or_create(
                service=service,
                from_stop=from_stop,
                to_stop=to_stop,
                travel_class=Fare.CLASS_SECOND,
                defaults={"amount": second_amt},
            )
            Fare.objects.update_or_create(
                service=service,
                from_stop=from_stop,
                to_stop=to_stop,
                travel_class=Fare.CLASS_THIRD,
                defaults={"amount": third_amt},
            )


class Command(BaseCommand):
    help = "Seed stations + routes + trains + services + stops + fares for E-Track MVP."

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Seeding E-Track railway data..."))

        # 1) Stations (+ lat/lng)
        for s in STATIONS_DATA:
            latlng = STATION_COORDS.get(s["code"])
            lat = latlng[0] if latlng else None
            lng = latlng[1] if latlng else None

            Station.objects.update_or_create(
                code=s["code"],
                defaults={
                    "name": s["name"],
                    "city": s["city"],
                    "state": s["state"],
                    "description": s["description"],
                    "address": s["address"],
                    "hours": s["hours"],
                    "phone": s["phone"],
                    "email": s["email"],
                    "head_of_org": s["head_of_org"],
                    "image_url": IMAGE_URL,
                    "lat": lat,
                    "lng": lng,
                    "is_active": True,
                },
            )
        self.stdout.write(self.style.SUCCESS("✅ Stations seeded."))

        # 2) Routes + Stops (4 routes)
        r1 = upsert_route("Chennai - Madurai")
        set_route_stops(r1, [
            {"code": "MAS", "arr": None, "dep": (6, 30), "day_offset": 0},
            {"code": "KPD", "arr": (8, 50), "dep": (9, 0), "day_offset": 0},
            {"code": "SA", "arr": (11, 10), "dep": (11, 20), "day_offset": 0},
            {"code": "TPJ", "arr": (13, 45), "dep": (14, 0), "day_offset": 0},
            {"code": "DG", "arr": (15, 45), "dep": (15, 55), "day_offset": 0},
            {"code": "MDU", "arr": (17, 10), "dep": None, "day_offset": 0},
        ])

        r2 = upsert_route("Bengaluru - Madurai")
        set_route_stops(r2, [
            {"code": "SBC", "arr": None, "dep": (7, 15), "day_offset": 0},
            {"code": "YPR", "arr": (7, 40), "dep": (7, 50), "day_offset": 0},
            {"code": "SA", "arr": (12, 0), "dep": (12, 10), "day_offset": 0},
            {"code": "ED", "arr": (13, 0), "dep": (13, 10), "day_offset": 0},
            {"code": "CBE", "arr": (14, 20), "dep": (14, 30), "day_offset": 0},
            {"code": "DG", "arr": (16, 45), "dep": (16, 55), "day_offset": 0},
            {"code": "MDU", "arr": (18, 10), "dep": None, "day_offset": 0},
        ])

        r3 = upsert_route("Chennai - Tirupati - Vijayawada")
        set_route_stops(r3, [
            {"code": "MS", "arr": None, "dep": (5, 45), "day_offset": 0},
            {"code": "MAS", "arr": (6, 10), "dep": (6, 25), "day_offset": 0},
            {"code": "KPD", "arr": (8, 30), "dep": (8, 40), "day_offset": 0},
            {"code": "TPTY", "arr": (10, 30), "dep": (10, 45), "day_offset": 0},
            {"code": "BZA", "arr": (14, 10), "dep": None, "day_offset": 0},
        ])

        r4 = upsert_route("Hyderabad - Vijayawada - Visakhapatnam")
        set_route_stops(r4, [
            {"code": "SC", "arr": None, "dep": (6, 0), "day_offset": 0},
            {"code": "HYB", "arr": (6, 25), "dep": (6, 40), "day_offset": 0},
            {"code": "BZA", "arr": (11, 30), "dep": (11, 45), "day_offset": 0},
            {"code": "VSKP", "arr": (16, 30), "dep": None, "day_offset": 0},
        ])

        self.stdout.write(self.style.SUCCESS("✅ Routes + stops seeded."))

        # 3) Trains + Services (6 trains)
        t1 = upsert_train("12635", "Vaigai Express")
        t2 = upsert_train("12677", "Bengaluru Madurai SF")
        t3 = upsert_train("16127", "Chennai Madurai Express")
        t4 = upsert_train("12603", "Hyderabad Visakhapatnam SF")
        t5 = upsert_train("16057", "Sapthagiri Express")
        t6 = upsert_train("16527", "Kannur Express (Demo)")

        s1 = upsert_service(t1, r1)
        s2 = upsert_service(t2, r2)
        s3 = upsert_service(t3, r1)
        s4 = upsert_service(t4, r4)
        s5 = upsert_service(t5, r3)
        s6 = upsert_service(t6, r2)

        self.stdout.write(self.style.SUCCESS("✅ Trains + services seeded."))

        # 4) Fares for every segment on each route
        upsert_fares(s1, r1, base_first=520, base_second=360, base_third=220)
        upsert_fares(s2, r2, base_first=540, base_second=380, base_third=240)
        upsert_fares(s3, r1, base_first=500, base_second=350, base_third=210)
        upsert_fares(s4, r4, base_first=600, base_second=420, base_third=260)
        upsert_fares(s5, r3, base_first=480, base_second=330, base_third=200)
        upsert_fares(s6, r2, base_first=530, base_second=370, base_third=235)

        self.stdout.write(self.style.SUCCESS("✅ Fares seeded."))
        self.stdout.write(self.style.SUCCESS("🎉 Seed completed! Trains search + booking will work smoothly."))