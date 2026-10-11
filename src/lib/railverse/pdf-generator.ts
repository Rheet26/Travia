import * as jspdfModule from "jspdf";
import QRCode from "qrcode";
import { toast } from "sonner";
import type { Booking, Train } from "./types";
import { formatJourneyDate } from "@/components/railverse/booking-modal";

export interface TicketPdfOptions {
  booking: Booking | Booking[];
  train?: Train | null | undefined;
}

function createJsPDFInstance(options: any) {
  const JsPdfClass =
    (jspdfModule as any).jsPDF ||
    (jspdfModule as any).default?.jsPDF ||
    (jspdfModule as any).default ||
    jspdfModule;
  return new JsPdfClass(options);
}

export async function buildTicketPdfDoc({
  booking,
  train,
}: TicketPdfOptions): Promise<{ doc: any; pnr: string; filename: string }> {
  const bookings = Array.isArray(booking) ? booking : [booking];
  if (bookings.length === 0) {
    throw new Error("No booking data provided for PDF generation.");
  }

  const primaryBooking = bookings[0]!;
  const pnr = primaryBooking.pnr || "UNKNOWN";
  const filename = `Travia_Ticket_${pnr}.pdf`;
  const trainNumber = train?.number || "22962";
  const trainName = train?.name || "VANDE BHARAT EXP";
  const fromStation = primaryBooking.fromStation || train?.from || "VADODARA JN (BRC)";
  const toStation = primaryBooking.toStation || train?.to || "MUMBAI CENTRAL (MMCT)";
  const journeyDateStr = primaryBooking.journeyDate || new Date().toISOString().split("T")[0]!;
  const formattedDate = formatJourneyDate(journeyDateStr);

  const doc = createJsPDFInstance({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Official Railway E-Ticket Color Palette (White Background, Times New Roman Font)
  const bgWhite = [255, 255, 255] as const; // #ffffff - White background
  const textBlack = [0, 0, 0] as const; // #000000 - High contrast black text
  const textDarkGray = [68, 68, 68] as const; // #444444 - Muted gray body text
  const textLightGray = [110, 110, 110] as const; // #6e6e6e - Secondary labels
  const accentCyan = [0, 131, 143] as const; // #00838f - Rich Cyan/Teal accent for PNR, Train, Headings
  const borderGray = [180, 190, 200] as const; // #b4bec8 - Subtle section border lines
  const borderLight = [220, 226, 232] as const; // #dce2e8 - Table row divider line
  const bgLightGray = [240, 244, 248] as const; // #f0f4f8 - Header & table row fill

  // Helper drawing functions
  const drawPageBackground = () => {
    doc.setFillColor(bgWhite[0], bgWhite[1], bgWhite[2]);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Outer subtle border around the entire A4 sheet
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.rect(8, 8, 194, 281);
  };

  const setTimesFont = (isBold = false, size = 9) => {
    doc.setFont("times", isBold ? "bold" : "normal");
    doc.setFontSize(size);
  };

  const drawHeaderBar = (pageNum: number) => {
    // Left: Railway Logo / Emblem Symbol
    doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.circle(18, 18, 6, "F");
    doc.setFillColor(bgWhite[0], bgWhite[1], bgWhite[2]);
    doc.circle(18, 18, 4.5, "F");
    doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.circle(18, 18, 2.5, "F");

    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    setTimesFont(true, 7);
    doc.text("TRAVIA", 18, 27, { align: "center" });

    // Center Title: Electronic Reservation Slip (ERS)
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    setTimesFont(true, 13);
    doc.text("Electronic Reservation Slip (ERS)", 105, 18, { align: "center" });
    setTimesFont(false, 8.5);
    doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
    doc.text("- Normal User", 152, 18);

    // Right: Travia / IRCTC Brand Box
    doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(180, 11, 17, 14, 2, 2, "D");
    doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    doc.triangle(184, 18, 188.5, 13, 193, 18, "F");
    doc.triangle(184, 18, 188.5, 23, 193, 18, "F");

    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    setTimesFont(true, 6);
    doc.text("IRCTC / TRAVIA", 188.5, 27, { align: "center" });

    // Top status pill (WL / CONFIRMED)
    if (primaryBooking.status === "CONFIRMED") {
      doc.setTextColor(0, 131, 143);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    setTimesFont(true, 10);
    doc.text(primaryBooking.status === "CONFIRMED" ? "CNF" : "WL", 35, 18);
    doc.text(primaryBooking.status === "CONFIRMED" ? "CNF" : "WL", 172, 18);

    // Divider Line
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.line(10, 29, 200, 29);
  };

  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.line(10, 282, 200, 282);

    doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
    setTimesFont(false, 7.5);
    doc.text(
      "Travia Digital Boarding Pass · Computer Generated E-Ticket · Valid with original Photo ID Proof",
      12,
      286,
    );

    doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
    setTimesFont(true, 8);
    doc.text(`Page ${pageNum} of 2`, 198, 286, { align: "right" });
  };

  // ==========================================
  // PAGE 1: E-TICKET DETAILS (ERS LAYOUT)
  // ==========================================
  drawPageBackground();
  drawHeaderBar(1);

  // 1. Journey Route Banner (Booked from ── Boarding At ──► To)
  let currY = 32;
  const bannerHeight = 18;

  doc.setFillColor(bgWhite[0], bgWhite[1], bgWhite[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.rect(10, currY, 190, bannerHeight, "D");

  // Center Arrow graphic
  doc.setFillColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.rect(80, currY + 4, 40, 6, "F");
  doc.triangle(120, currY + 2, 130, currY + 7, 120, currY + 12, "F");

  doc.setTextColor(255, 255, 255);
  setTimesFont(true, 8.5);
  doc.text("Boarding At", 100, currY + 8.2, { align: "center" });

  // Left Column: Booked from
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  setTimesFont(true, 8.5);
  doc.text("Booked from", 35, currY + 4.5, { align: "center" });

  setTimesFont(true, 10);
  doc.text(fromStation.toUpperCase(), 35, currY + 10, { align: "center" });

  const deptTime = primaryBooking.boardingTime || train?.departure || "06:58";
  setTimesFont(false, 8);
  doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
  doc.text(`Start Date* ${formattedDate}`, 35, currY + 15, { align: "center" });

  // Center Departure Info below arrow
  setTimesFont(true, 9.5);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text(`Departure* ${deptTime} ${formattedDate}`, 105, currY + 15, { align: "center" });

  // Right Column: To Station
  setTimesFont(true, 8.5);
  doc.text("To", 168, currY + 4.5, { align: "center" });

  setTimesFont(true, 10);
  doc.text(toStation.toUpperCase(), 168, currY + 10, { align: "center" });

  const arrTime = primaryBooking.arrivalTime || train?.arrival || "11:45";
  setTimesFont(false, 8);
  doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
  doc.text(`Arrival* ${arrTime} ${formattedDate}`, 168, currY + 15, { align: "center" });

  // 2. Train & Ticket Info Grid Table (PNR | Train No./Name | Class)
  currY = 53;
  const gridHeight = 22;

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.rect(10, currY, 190, gridHeight, "D");
  doc.line(73, currY, 73, currY + gridHeight);
  doc.line(136, currY, 136, currY + gridHeight);
  doc.line(10, currY + 11, 200, currY + 11);

  // Row 1: PNR | Train No/Name | Class
  setTimesFont(true, 8);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text("PNR", 41.5, currY + 4, { align: "center" });
  doc.text("Train No./Name", 104.5, currY + 4, { align: "center" });
  doc.text("Class", 168, currY + 4, { align: "center" });

  setTimesFont(true, 11);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.text(pnr, 41.5, currY + 9, { align: "center" });

  // Train No./Name cell rendering with wrap & boundary safety
  const fullTrainText = `${trainNumber} / ${trainName.toUpperCase()}`;
  const maxTrainColWidth = 58; // mm (leaves safe > 2.5mm margin on both left X=73 and right X=136)

  let trainFontSize = 10;
  setTimesFont(true, trainFontSize);
  let trainLines = doc.splitTextToSize(fullTrainText, maxTrainColWidth);

  if (trainLines.length > 2) {
    trainFontSize = 8.5;
    setTimesFont(true, trainFontSize);
    trainLines = doc.splitTextToSize(fullTrainText, maxTrainColWidth);
  }
  if (trainLines.length > 2) {
    trainFontSize = 7.5;
    setTimesFont(true, trainFontSize);
    trainLines = doc.splitTextToSize(fullTrainText, maxTrainColWidth);
  }

  setTimesFont(true, trainFontSize);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);

  if (trainLines.length === 1) {
    doc.text(trainLines[0], 104.5, currY + 9, { align: "center" });
  } else if (trainLines.length === 2) {
    doc.text(trainLines[0], 104.5, currY + 7.2, { align: "center" });
    doc.text(trainLines[1], 104.5, currY + 10.2, { align: "center" });
  } else {
    const lineStep = 2.8;
    const startY = currY + 6.5;
    trainLines.slice(0, 3).forEach((line: string, idx: number) => {
      doc.text(line, 104.5, startY + idx * lineStep, { align: "center" });
    });
  }

  setTimesFont(true, 11);
  doc.text("CHAIR CAR (CC) / 3A", 168, currY + 9, { align: "center" });

  // Row 2: Quota | Distance | Booking Date
  setTimesFont(true, 8);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text("Quota", 41.5, currY + 15, { align: "center" });
  doc.text("Distance", 104.5, currY + 15, { align: "center" });
  doc.text("Booking Date", 168, currY + 15, { align: "center" });

  setTimesFont(false, 8.5);
  doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
  doc.text("GENERAL (GN)", 41.5, currY + 19.5, { align: "center" });
  doc.text("392 KM", 104.5, currY + 19.5, { align: "center" });

  const bookedTimestamp = new Date(primaryBooking.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(bookedTimestamp, 168, currY + 19.5, { align: "center" });

  // 3. Passenger Details Table
  currY = 78;
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  setTimesFont(true, 10.5);
  doc.text("Passenger Details", 10, currY);
  doc.setDrawColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.setLineWidth(0.8);
  doc.line(10, currY + 1.5, 45, currY + 1.5);

  currY += 4;
  const tableHeaderHeight = 7;
  const rowHeight = 8;
  const numPassengers = bookings.length;
  const tableTotalHeight = tableHeaderHeight + numPassengers * rowHeight;

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.rect(10, currY, 190, tableTotalHeight, "D");

  // Table Header Background Fill
  doc.setFillColor(bgLightGray[0], bgLightGray[1], bgLightGray[2]);
  doc.rect(10, currY, 190, tableHeaderHeight, "F");

  setTimesFont(true, 8);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);

  doc.text("#", 13, currY + 5);
  doc.text("Name", 22, currY + 5);
  doc.text("Age", 75, currY + 5);
  doc.text("Gender", 95, currY + 5);
  doc.text("Booking Status", 125, currY + 5);
  doc.text("Current Status / Seat", 165, currY + 5);

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(10, currY + tableHeaderHeight, 200, currY + tableHeaderHeight);

  // Render Passengers Rows
  bookings.forEach((b, idx) => {
    const rowY = currY + tableHeaderHeight + idx * rowHeight;

    setTimesFont(false, 8.5);
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    doc.text(`${idx + 1}.`, 13, rowY + 5.5);

    setTimesFont(true, 8.5);
    doc.text(b.passengerName, 22, rowY + 5.5);

    setTimesFont(false, 8.5);
    doc.text(`${b.age}`, 75, rowY + 5.5);
    doc.text(b.gender === "Female" ? "F" : "M", 95, rowY + 5.5);

    // Status
    if (b.status === "CONFIRMED") {
      doc.setTextColor(0, 131, 143);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    setTimesFont(true, 8.5);
    doc.text(
      b.status === "CONFIRMED" ? "CONFIRMED" : `RLWL/${b.queuePosition || 13}`,
      125,
      rowY + 5.5,
    );

    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    if (b.status === "CONFIRMED") {
      doc.text(`Seat ${b.seatNumber} (${b.berth || "Lower"})`, 165, rowY + 5.5);
    } else {
      doc.text(`RLWL/${b.queuePosition || 13}`, 165, rowY + 5.5);
    }

    if (idx < numPassengers - 1) {
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.line(10, rowY + rowHeight, 200, rowY + rowHeight);
    }
  });

  // Small acronym note below table
  currY = currY + tableTotalHeight + 3;
  setTimesFont(false, 6.5);
  doc.setTextColor(textLightGray[0], textLightGray[1], textLightGray[2]);
  doc.text(
    "Acronyms: RLWL: REMOTE LOCATION WAITLIST  |  PQWL: POOLED QUOTA WAITLIST  |  RSWL: ROAD-SIDE WAITLIST",
    10,
    currY,
  );

  // 4. Transaction ID & Payment Details (Left Box) + Scannable QR Code (Right Box)
  currY += 5;
  const paySectionHeight = 58;

  // Transaction ID Header
  setTimesFont(true, 9.5);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text(`Transaction ID: ${primaryBooking.id}`, 10, currY);
  currY += 4;
  setTimesFont(false, 7.5);
  doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
  doc.text("IR recovers only 57% of cost of travel on an average.", 10, currY);

  currY += 5;
  // Left: Payment Details Table
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  setTimesFont(true, 10);
  doc.text("Payment Details", 10, currY);
  doc.setDrawColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.setLineWidth(0.8);
  doc.line(10, currY + 1.5, 42, currY + 1.5);

  currY += 5;

  const totalFare = bookings.reduce((sum, b) => sum + b.fare, 0);
  const baseFare = Math.round(totalFare * 0.88);
  const convFee = totalFare - baseFare;

  let fareY = currY;
  const addPayRow = (label: string, val: string, isBold = false, isCyan = false) => {
    setTimesFont(isBold, 8.5);
    doc.setTextColor(
      isCyan ? accentCyan[0] : isBold ? textBlack[0] : textDarkGray[0],
      isCyan ? accentCyan[1] : isBold ? textBlack[1] : textDarkGray[1],
      isCyan ? accentCyan[2] : isBold ? textBlack[2] : textDarkGray[2],
    );
    doc.text(label, 10, fareY);
    doc.text(val, 95, fareY, { align: "right" });
    fareY += 5.5;
  };

  addPayRow("Ticket Fare", `Rs. ${baseFare.toFixed(2)}`);
  addPayRow("IRCTC Convenience Fee (Incl. of GST)", `Rs. ${convFee.toFixed(2)}`);
  addPayRow("Total Fare (all inclusive)", `Rs. ${totalFare.toFixed(2)}`, true, true);

  setTimesFont(false, 7);
  doc.setTextColor(textLightGray[0], textLightGray[1], textLightGray[2]);
  doc.text("PG Charges as applicable (Additional)", 10, fareY);

  // Right: QR Code Box (Clean standalone box without text overlay)
  const qrBoxX = 148;
  const qrBoxWidth = 52;
  const qrBoxHeight = 44;
  const qrTopY = currY - 9;

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.rect(qrBoxX, qrTopY, qrBoxWidth, qrBoxHeight, "D");

  // Generate High-Contrast Scannable QR Code with structured human-readable ticket details
  const paxListStr = bookings
    .map((b, i) => {
      const seatDetail =
        b.status === "CONFIRMED"
          ? `Seat ${b.seatNumber || "N/A"} (${b.berth || "Lower"})`
          : `Queue #${b.queuePosition || 1}`;
      return `${i + 1}. ${b.passengerName} (${b.age}, ${b.gender ? b.gender[0] : "M"}) - ${b.status} - ${seatDetail}`;
    })
    .join("\n");

  const qrPayload = [
    `TRAVIA ELECTRONIC RESERVATION SLIP`,
    `==================================`,
    `PNR: ${pnr}`,
    `Booking ID: ${primaryBooking.id}`,
    `Status: ${primaryBooking.status}`,
    `Train: ${trainNumber} - ${trainName}`,
    `From: ${fromStation}`,
    `To: ${toStation}`,
    `Date: ${formattedDate}`,
    `Departure: ${deptTime}`,
    `Passenger(s):`,
    paxListStr,
    `==================================`,
    `Verified by Travia Rail System`,
  ].join("\n");

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Clean QR image placement inside box with zero text overlap
    doc.addImage(qrDataUrl, "PNG", qrBoxX + 6, qrTopY + 2, 40, 40);
  } catch (err) {
    setTimesFont(false, 7);
    doc.text("QR Code Error", qrBoxX + 26, qrTopY + 22, { align: "center" });
  }

  // 5. Advisories & Legal Disclaimers (Page 1 Bottom)
  currY = Math.max(fareY + 4, qrTopY + qrBoxHeight + 4);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(10, currY, 200, currY);

  currY += 4;
  setTimesFont(true, 7.5);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text(
    "• Beware of fraudulent customer care number. For any assistance, use only official helpline: 139.",
    10,
    currY,
  );

  currY += 4;
  setTimesFont(false, 7.5);
  doc.text(
    "IRCTC Convenience Fee is charged per e-ticket irrespective of number of passengers on the ticket.",
    10,
    currY,
  );

  currY += 4;
  setTimesFont(true, 7.5);
  doc.text(
    "* The printed Departure and Arrival Times are liable to change. Please Check correct departure, arrival from Station Enquiry.",
    10,
    currY,
  );

  currY += 5;
  doc.line(10, currY, 200, currY);

  currY += 4;
  setTimesFont(false, 7);
  doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
  doc.text(
    "• This ticket is booked on a personal User ID, its sale/purchase is an offence u/s 143 of the Railways Act,1989.",
    10,
    currY,
  );

  currY += 3.5;
  doc.text(
    "• Prescribed original ID proof is required while travelling along with ERS otherwise will be treated as without ticket.",
    10,
    currY,
  );

  // GST & Tax Breakdown Section Box
  currY += 5;
  doc.setFillColor(bgLightGray[0], bgLightGray[1], bgLightGray[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.rect(10, currY, 190, 32, "FD");

  setTimesFont(true, 7.5);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text("Indian Railways GST Details:", 12, currY + 4);

  setTimesFont(false, 7);
  doc.text("Invoice Number: PS26894107922511", 12, currY + 9);
  doc.text("Supplier Address: Indian Railways New Delhi", 90, currY + 9);

  doc.text("SAC Code: 996421", 12, currY + 14);
  doc.text("GSTIN: 07AAAGM0289C1ZL", 90, currY + 14);

  doc.text("Taxable Value: Rs. 871.00", 12, currY + 19);
  doc.text("CGST Rate: 2.5% (Rs. 21.78)", 70, currY + 19);
  doc.text("SGST Rate: 2.5% (Rs. 21.78)", 130, currY + 19);

  setTimesFont(true, 7.5);
  doc.text("Total Tax: Rs. 43.55", 12, currY + 24);
  doc.text("Place of Supply: Delhi (07)", 70, currY + 24);
  doc.text("State Code: DL", 130, currY + 24);

  drawFooter(1);

  // ==========================================
  // PAGE 2: TRAVEL INSTRUCTIONS (ERS WHITE THEME)
  // ==========================================
  doc.addPage();
  drawPageBackground();
  drawHeaderBar(2);

  currY = 33;
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  setTimesFont(true, 10.5);
  doc.text("INSTRUCTIONS & TERMS AND CONDITIONS", 10, currY);
  doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.setLineWidth(0.8);
  doc.line(10, currY + 1.5, 95, currY + 1.5);

  currY += 6;

  const instructionsList = [
    "Prescribed Original ID proofs are:- Voter Identity Card / Passport / PAN Card / Driving License / Photo ID card issued by Central / State Govt. / Public Sector Undertakings of State / Central Government / District Administrations / Municipal Bodies and Panchayat Administrations which are having serial number / Student Identity Card with photograph issued by recognized School or College for their students / Nationalized Bank Passbook with photograph / Credit Cards issued by Banks with laminated photograph / Unique Identification Card 'Aadhaar', e-Aadhaar. / Passenger showing the Aadhaar / Driving Licence from the 'Issued Document' section by logging into his/her DigiLocker account considered as valid proof of identity.",
    "PNRs having fully waitlisted status will be dropped and automatic refund of the ticket amount after deducting the applicable CLERKAGE by Railway shall be credited to the account used for payment for booking of the ticket.",
    "A clerkage charge of Rs.60 per passenger plus GST for AC Classes and Rs.60 per passenger for Non AC classes will be deducted if the ticket remains Waitlisted at the time of Cancellation/Chart preparation.",
    "Passengers travelling on a fully waitlisted e-ticket will be treated as Ticketless.",
    "Obtain certificate from the TTE / Conductor in case of (a) PARTIALLY waitlisted e-ticket when LESS NO. OF PASSENGERS travel, (b) A.C FAILURE, (c) TRAVEL IN LOWER CLASS. This original certificate must be sent to IRCTC / Travia for claiming refund.",
    "In case, on a party e-ticket or a family e-ticket issued for travel of more than one passenger, some passengers have confirmed reservation and others are on RAC or wait list, full refund of fare, less clerkage, shall be admissible for confirmed passengers also subject to the condition that the ticket shall be cancelled online or online TDR shall be filed for all the passengers upto thirty minutes before the scheduled departure of the train.",
    "In case train is late more than 3 hours, refund is admissible as per railway refund rules only when TDR is filed by the user before the actual departure of the train at boarding station and passenger has not travelled.",
    "In case of train cancellation on its entire run, full refund is granted automatically by the system. However, if the train is cancelled partially on its run or diverted and not touching boarding/destination station, passengers are required to file online TDR within 72 hours of scheduled departure.",
    "Never purchase e-ticket from unauthorized agents or persons using their personal IDs for commercial purposes. Such tickets are liable to be cancelled and forfeited without any refund of money under section 143 of the Indian Railway Act 1989.",
    "For detail, Rules, Refund rules, Terms & Conditions of E-Ticketing Services, Travel Insurance facility etc. Please visit www.irctc.co.in or www.traviarail.com",
    "While booking this ticket, you have agreed of having read the Health Protocol of Destination State of your travel. You are again advised to clearly read the Health Protocol advisory of destination state before start of your travel and follow them properly.",
    "The FIR forms are available with on board ticket checking staff, train guard and train escorting RPF/GRP staff.",
    "Variety of meals available in more than 1500 trains. For delivery of meal of your choice on your seat log on to ecatering.irctc.co.in or call 1323 Toll Free.",
  ];

  instructionsList.forEach((text, index) => {
    setTimesFont(true, 7.5);
    doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
    const numPrefix = `${index + 1}. `;
    doc.text(numPrefix, 10, currY);

    setTimesFont(false, 7.2);
    doc.setTextColor(textDarkGray[0], textDarkGray[1], textDarkGray[2]);
    const splitText = doc.splitTextToSize(text, 182);
    doc.text(splitText, 16, currY);

    currY += splitText.length * 3.6 + 2.2;
  });

  // Support Box at bottom of Page 2
  currY += 2;
  doc.setFillColor(bgLightGray[0], bgLightGray[1], bgLightGray[2]);
  doc.setDrawColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.setLineWidth(0.4);
  doc.rect(10, currY, 190, 22, "FD");

  setTimesFont(true, 8.5);
  doc.setTextColor(accentCyan[0], accentCyan[1], accentCyan[2]);
  doc.text("TRAVIA CUSTOMER SUPPORT & EMERGENCY HELPLINES", 14, currY + 5);

  setTimesFont(false, 7.5);
  doc.setTextColor(textBlack[0], textBlack[1], textBlack[2]);
  doc.text("• 24x7 Railway Helpline: 139 (Toll Free) / 1800-TRAVIA-RAIL", 14, currY + 10);
  doc.text("• Medical & Security Emergency: Dial 139 Option 1", 115, currY + 10);

  doc.text("• Customer Support Email: support@traviarail.com", 14, currY + 15);
  doc.text("• Official Portal: https://traviarail.com", 115, currY + 15);

  drawFooter(2);

  return { doc, pnr, filename };
}

export async function generateTicketPDFBuffer(
  options: TicketPdfOptions,
): Promise<{ pdfBuffer: ArrayBuffer; filename: string; pnr: string }> {
  const { doc, pnr, filename } = await buildTicketPdfDoc(options);
  const pdfBuffer = doc.output("arraybuffer");
  return { pdfBuffer, filename, pnr };
}

export async function downloadTicketPDF(options: TicketPdfOptions): Promise<void> {
  const toastId = toast.loading("Generating E-Ticket PDF...");

  try {
    const response = await fetch("/api/generate-ticket-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (response.ok) {
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `Travia_Ticket_${Array.isArray(options.booking) ? options.booking[0]?.pnr : options.booking.pnr || "TICKET"}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("E-Ticket PDF downloaded successfully!", { id: toastId });
      return;
    }

    // Fallback: If API returns error, build PDF client-side
    console.warn(
      "API PDF endpoint returned status",
      response.status,
      ". Falling back to client PDF generator.",
    );
    const { doc, filename } = await buildTicketPdfDoc(options);
    doc.save(filename);
    toast.success("E-Ticket PDF downloaded successfully!", { id: toastId });
  } catch (err: any) {
    console.warn(
      "Network error reaching PDF API endpoint. Falling back to client PDF generator.",
      err,
    );
    try {
      const { doc, filename } = await buildTicketPdfDoc(options);
      doc.save(filename);
      toast.success("E-Ticket PDF downloaded successfully!", { id: toastId });
    } catch (clientErr: any) {
      toast.error(clientErr?.message || "Failed to generate ticket PDF.", { id: toastId });
    }
  }
}
