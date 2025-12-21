import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  header: { alignItems: "center", marginBottom: 10 },
  logo: { width: 120, marginBottom: 5 },
  section: { marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: { fontWeight: "bold" },
  box: {
    border: "1 solid #000",
    padding: 6,
    marginBottom: 6,
  },
});

export default function GuestRegistrationPdf({
  guest,
  room,
  regNo,
  nationality,
}: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo/logo.png`}
            style={styles.logo}
          />
          <Text>MOUNTAINPASS RESIDENCY</Text>
          <Text>GSTIN: 32ALJPV1222B1ZN</Text>
          <Text>Guest Registration Card</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>Guest Information</Text>
          <Text>Name: {guest.name}</Text>
          <Text>Phone: {guest.phone}</Text>
          <Text>Address: {guest.address}</Text>
          <Text>Nationality: {nationality}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>Stay Details</Text>
          <Text>Registration No: {regNo}</Text>
          <Text>Room No: {room.room_number}</Text>
          <Text>Room Type: {room.room_types.name}</Text>
          <Text>Tariff: ₹{room.room_types.base_price}</Text>
          <Text>Check-in: {guest.check_in}</Text>
          <Text>Check-out: {guest.check_out}</Text>
        </View>

        <View style={styles.box}>
          <Text>Guest Signature:</Text>
          <Text style={{ marginTop: 20 }}>______________________</Text>
        </View>

        <View style={styles.box}>
          <Text>FOA Signature:</Text>
          <Text style={{ marginTop: 20 }}>______________________</Text>
        </View>
      </Page>
    </Document>
  );
}
