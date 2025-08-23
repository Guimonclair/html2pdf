window.function = function (
  html,
  fileName,
  format,
  zoom,
  orientation,
  margin,
  breakBefore,
  breakAfter,
  breakAvoid,
  fidelity,
  customDimensions
) {
  const fidelityMap = {
    low: 1,
    standard: 1.5,
    high: 2,
  };

  html = html.value ?? "No HTML set.";
  fileName = fileName.value ?? `pdf-${Date.now()}`;
  format = format.value ?? "a4";
  zoom = zoom.value ?? "1";
  orientation = orientation.value ?? "portrait";
  margin = margin.value ?? "0";
  breakBefore = breakBefore.value ? breakBefore.value.split(",") : [];
  breakAfter = breakAfter.value ? breakAfter.value.split(",") : [];
  breakAvoid = breakAvoid.value ? breakAvoid.value.split(",") : [];
  quality = fidelityMap[fidelity.value] ?? 1.5;
  customDimensions = customDimensions.value
    ? customDimensions.value.split(",").map(Number)
    : null;

  const formatDimensions = {
    a4: [1240, 1754],
    letter: [1276, 1648],
    legal: [1276, 2102],
    // ... outros formatos omitidos para brevidade
  };

  const dimensions = customDimensions || formatDimensions[format];
  const finalDimensions = dimensions.map((d) => Math.round(d / zoom));

  const customCSS = `
    body { margin: 0!important }
    button#download {
      position: fixed;
      border-radius: 0.5rem;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.5rem;
      color: #0d0d0d;
      border: none;
      font-family: 'Inter';
      padding: 0px 12px;
      height: 32px;
      background: #ffffff;
      top: 8px;
      right: 8px;
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 1px 2.5px rgba(0, 0, 0, 0.1);
      cursor: pointer;
    }
    button#download:hover {
      background: #f5f5f5;
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06), 0 6px 12px -3px rgba(0, 0, 0, 0.1);
    }
    button#download.downloading { color: #ea580c; }
    button#download.done { color: #16a34a; }
    ::-webkit-scrollbar { width: 5px; background-color: rgb(0 0 0 / 8%); }
    ::-webkit-scrollbar-thumb { background-color: rgb(0 0 0 / 32%); border-radius: 4px; }
  `;

  const originalHTML = `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js"></script>
    <style>${customCSS}</style>
    <div class="main">
      <div class="header">
        <button class="button" id="download">Baixar o Laudo</button>
      </div>
      <div id="content">${html}</div>
    </div>
    <script>
      function gerarPDF(element, button) {
        var opt = {
          pagebreak: {
            mode: ['css'],
            before: ${JSON.stringify(breakBefore)},
            after: ${JSON.stringify(breakAfter)},
            avoid: ${JSON.stringify(breakAvoid)}
          },
          margin: ${margin},
          filename: ${JSON.stringify(fileName)} + '.pdf',
          html2canvas: {
            useCORS: true,
            scale: ${quality}
          },
          jsPDF: {
            unit: 'px',
            orientation: '${orientation}',
            format: [${finalDimensions}],
            hotfixes: ['px_scaling']
          }
        };

        html2pdf().set(opt).from(element).outputPdf('blob').then(function(pdfBlob) {
          const formData = new FormData();
          formData.append('file', pdfBlob);
          formData.append('upload_preset', 'glide_pdf');
          formData.append('public_id', ${JSON.stringify(fileName)});
          formData.append('resource_type', 'raw');

          fetch('https://api.cloudinary.com/v1_1/guimonclair/raw/upload', {
            method: 'POST',
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            console.log('✅ PDF enviado para Cloudinary:', data.secure_url);
            if (button) {
              button.innerText = 'Feito 🎉';
              button.className = 'done';
              setTimeout(() => {
                button.innerText = 'Baixar';
                button.className = '';
              }, 2000);
            }
          })
          .catch(err => {
            console.error('❌ Erro ao enviar PDF:', err);
            if (button) {
              button.innerText = 'Erro ❌';
              button.className = 'error';
            }
          });
        });
      }

      document.addEventListener('DOMContentLoaded', function () {
        var element = document.getElementById('content');
        var button = document.getElementById('download');

        // Geração automática ao carregar
        gerarPDF(element, null);

        // Geração manual via botão
        button.addEventListener('click', function () {
          button.innerText = 'Baixando...';
          button.className = 'downloading';
          gerarPDF(element, button);
        });
      });
    </script>
  `;

  const encodedHtml = encodeURIComponent(originalHTML);
  return "data:text/html;charset=utf-8," + encodedHtml;
};
