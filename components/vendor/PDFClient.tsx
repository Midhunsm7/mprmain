"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

/* ---------------- PDF Styles ---------------- */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
  },
  header: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  total: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
});

/* ---------------- PDF Document ---------------- */
function BillPDF(props: {
  vendorName: string;
  description: string;
  amount: string;
  gst: string;
  total: number;
  today: string;
}) {
  const { vendorName, description, amount, gst, total, today } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>RESORT VENDOR BILL</Text>

        <Text>Date: {today}</Text>
        <Text>Vendor: {vendorName || "-"}</Text>
        <Text>Description: {description || "-"}</Text>

        <View style={{ marginTop: 20 }}>
          <View style={styles.row}>
            <Text>Amount</Text>
            <Text>₹{amount || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text>GST</Text>
            <Text>₹{gst || 0}</Text>
          </View>
          <View style={styles.total}>
            <Text>Total: ₹{total}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/* ---------------- Download Button ---------------- */
export default function PDFClient(props: {
  vendorName: string;
  description: string;
  amount: string;
  gst: string;
  total: number;
  today: string;
}) {
  return (
    <PDFDownloadLink
      document={<BillPDF {...props} />}
      fileName={`Vendor_Bill_${props.today}.pdf`}
      className="w-full"
    >
      {({ loading }) =>
        loading ? "Generating PDF..." : "Download PDF"
      }
    </PDFDownloadLink>
  );
}
