import { submitLeadAction } from "../app/actions/lead-actions";

async function testLeadInsertion() {
  console.log("🧪 Probando submitLeadAction con GCLID y Enhanced Conversions...");

  const result = await submitLeadAction({
    nombre: "Javier Prueba GCLID",
    telefono: "3001234567",
    email: "javier.test@vetadeoro.co",
    tipoProyecto: "Cocina Integral",
    ubicacion: "Bogotá D.C.",
    gclid: "TEST_GCLID_VETA_2026_SUCCESS",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "cocinas_integrales",
  });

  console.log("📌 Resultado:", result);

  if (result.success && result.leadId) {
    console.log("🎉 Lead guardado exitosamente en Neon Postgres con ID:", result.leadId);
  } else {
    console.error("❌ Falló el guardado del lead:", result.error);
  }
  process.exit(0);
}

testLeadInsertion();
