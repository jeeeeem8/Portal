function getSelectedReportsHtml() {
  const reports = document.querySelectorAll(".report.selected");
  let contents = '<h1>Selected Deployment Reports</h1>';
  reports.forEach(r => contents += r.outerHTML);
  return contents;
}

document.getElementById("exportPDFBtn").onclick = function() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit: 'pt', format: 'a4'});
  let html = getSelectedReportsHtml();

  // Simple conversion using jsPDF html plugin
  doc.html(document.createElement('div'), {
    html: html,
    callback: function(doc) {
      doc.save("DeploymentReports.pdf");
    },
    margin: [20, 20, 20, 20],
    autoPaging: true,
    x: 0,
    y: 0
  });
};

document.getElementById("exportDocxBtn").onclick = function() {
  let html = getSelectedReportsHtml();
  let converted = window.htmlDocx.asBlob(html);
  saveAs(converted, "DeploymentReports.docx");
};

document.getElementById("exportTxtBtn").onclick = function() {
  let plainText = "";
  document.querySelectorAll(".report.selected").forEach(r => {
    plainText += r.innerText + "\n\n";
  });
  let blob = new Blob([plainText], {type: "text/plain"});
  saveAs(blob, "DeploymentReports.txt");
};

document.getElementById("exportHtmlBtn").onclick = function() {
  let html = getSelectedReportsHtml();
  let blob = new Blob([html], {type: "text/html"});
  saveAs(blob, "DeploymentReports.html");
};
