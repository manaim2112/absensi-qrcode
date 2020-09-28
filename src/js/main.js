let storage = localStorage.getItem('absensi_zi');
let refresh = localStorage.getItem('refresh');
if(!storage) { localStorage.setItem('absensi_zi', JSON.stringify([])); }
if(!refresh) { localStorage.setItem('refresh', Date.parse(new Date().setHours(5,  0, 0))); }


function q(element) {
    return document.querySelector(element);
}
function event(element, events, response) {
    let event = events.split(' ');
    for(const a of event) {
        q(element).addEventListener('click', response, false);
    }
}
/**
 * draw canvas box
 * @param {*} begin 
 * @param {*} end 
 * @param {*} color 
 */
function drawLine(begin, end, color) {
    let canvasElement = document.getElementById("canvas"),
        canvas = canvasElement.getContext("2d");
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
}

/**
 * Process load video in canvas
 */
function tick() {
    let canvasElement = document.getElementById("canvas"),
        canvas = canvasElement.getContext("2d"),
        loadingMessage = document.getElementById("loadingMessage");

  loadingMessage.innerText = "⌛ Proses..."
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    canvasElement.hidden = false;


    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    var code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#13e400");
      drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#13e400");
      drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#13e400");
      drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#13e400");
      
      return check(code.data);
    } 
  }
  requestAnimationFrame(tick);
}

/**
 * Check data apakah ada yang sama
 * @param {*} request 
 */
function check(request) {
    let data = JSON.parse(request),
        storage = JSON.parse(localStorage.getItem('absensi_zi'));
    /**
     * Jika 3 kali nunjukkin, maka keluar otomatis
     */
    if(!sessionStorage.getItem('num')) { sessionStorage.setItem('num', 1)}
    if(!sessionStorage.getItem('lastId')) { sessionStorage.setItem('lastId', data.id)}
    

    storage = storage.filter((Obj) => { return parseInt(Obj.id) == parseInt(data.id);});
    if(storage.length < 1) return push(request);
    if(storage[0].out.split('').length > 1) {
        Swal.fire({
            title : 'Anda Sudah Keluar',
            showConfirmButton : false,
            timer  :  1000,
            timerProgressBar : true,
        });
        reload(1000);
    } else if(storage[0].in.split('').length > 1)  {
        Swal.fire({
            title : 'Anda Sudah Masuk',
            text  : 'Ingin Keluar ? ' + data.name,
            timer: 1000,
            timerProgressBar: true,
            confirmButtonText  : 'Keluar Sekarang'
        }).then((result) => {
            if(result.isConfirmed) { return update(JSON.stringify(storage[0]))};
            
            let session = sessionStorage.getItem('num'),
                id  = sessionStorage.getItem('lastId');
            if(parseInt(data.id) == parseInt(id)) {
                session++;
                sessionStorage.setItem('num', session);
            } else {
                sessionStorage.setItem('num', 1);
                sessionStorage.setItem('lastId', data.id);
            }

            if(session  >= 3) {
                sessionStorage.removeItem('num');
                sessionStorage.removeItem('lastId');
                return update(JSON.stringify(storage[0]));
            }
            
            reload(50);
        });
    }

}

/**
 * Menambah data
 * @param {*} data 
 */
function push(data) {
    let storage = JSON.parse(localStorage.getItem('absensi_zi')),
        res = JSON.parse(data),
        save = { id : res.id,  name : res.name, in : new Date().toString().split(' ')[4], out : ''};
    
    storage.push(save);
    localStorage.setItem('absensi_zi', JSON.stringify(storage));

    toast({ title : 'Selamat datang', text : res.name, icon : 'success'});

    return reload(2000);
}

/**
 * Update Data
 * @param {*} data 
 */
function update(data) {
    let res = JSON.parse(data),
        updated = { id : res.id, name : res.name, in : res.in, out : new Date().toString().split(' ')[4]},
        storage = JSON.parse(localStorage.getItem('absensi_zi'));
    
    storage = storage.filter((Obj) => { return parseInt(Obj.id) != parseInt(updated.id)});

    storage.push(updated);
    localStorage.setItem('absensi_zi', JSON.stringify(storage));

    toast({ title : 'Selamat istirahat', text : res.name, icon : 'success'});
    
    return reload(2000)
}

/**
 * method Toast With SweetAlert2
 * @param {*} Obj 
 */
function toast(Obj) {
    Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    }).fire(Obj);
}

/**
 * refresh page
 * @param {*} timing 
 */
function reload(timing) {
    setTimeout(() => {
        window.location.reload()
    }, timing);
}

function view() {
    let storage = JSON.parse(localStorage.getItem('absensi_zi')),
        data = '<table style="border:1px solid #000;"><thead><tr><td> Kode </td> <td> Nama </td><td> Masuk </td> <td> Pulang </td></tr></thead><tbody>';
    
    for(const a of storage) {
        data += `<tr><td> ${a.id} </td> <td> ${a.name} </td> <td> ${a.in}  </td> <td>  ${a.out}</td></tr>`;
    }
    data += '</tbody><table>';
    Swal.fire({
        title : 'Data Absensi',
        html : ` Tanggal ${new Date().toJSON().split('T')[0]} ${data} `,
        showConfirmButton : false
    });
}

function remove() {
    Swal.fire({
        title : 'Apa Kamu Yakin Ingin Hapus ?',
        text : ' Dengan menghapus ini, data anda tidak bisa dikembalikan kembali',
        icon : 'warning',
        showConfirmButton : true,
        showDenyButton : true,
        confirmButtonText : 'Hapus',
        denyButtonText : 'Jangan Hapus'
    }).then((response) => {
        if(response.isConfirmed) {
            localStorage.setItem('absensi_zi', JSON.stringify([]));
            toast({ title : 'Berhasil Dihapus', icon : 'success'});
        } else if(response.isDenied) {
            toast({ title : 'Tidak di hapus', icon : 'success'});
        }
    })
}

function download() {
    let data = JSON.parse(localStorage.getItem('absensi_zi'));
    data = data.sort((a, b)  => { return a.id - b.id; });
    var wb = XLSX.utils.book_new();
    var ws_name = "absensi";

    /* make worksheet */
    var ws_data = [[ "no", "kode", "nama", "masuk", "keluar"]];

    data.forEach((value, key) => {
        ws_data.push([key, value.id, value.name, value.in, value.out]);
    });
    ws_data.push([]);
    ws_data.push(['rilis', new Date().toJSON().split('T')[0], '', '']);
    var ws = XLSX.utils.aoa_to_sheet(ws_data);

    /* Add the worksheet to the workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    /* bookType can be any supported output type */
    var wopts = { bookType:'xlsx', bookSST:false, type:'array' };

    var wbout = XLSX.write(wb,wopts);

    /* the saveAs call downloads a file on the local machine */
    let nameFile = new Date().toJSON().split('T')[0] +  '.absensi.xlsx';

    Swal.fire({
        title : 'Yakin Ingin Download ?',
        icon : 'info',
        text : 'Dengan anda mendownload data absensi, maka data sebelumnya akan terhapus dan tidak bisa dikembalikan kembali',
        showConfirmButton : true,
        confirmButtonText : 'Download'
    }).then((result) => {
        if(result.isConfirmed) {
            saveAs(new Blob([wbout],{type:"application/octet-stream"}), nameFile);

            localStorage.setItem('absensi_zi', JSON.stringify([]));
            localStorage.setItem('refresh', new Date().setHours(6, 0, 0, 0));
        }
    });
}

function autodownload()  {
    let parse = Date.parse(new Date()),
        cumulative = parse-localStorage.getItem('refresh');
    if(cumulative > 86400*1000) {
        Swal.fire('Sedang Download Absensi yang kemaren', '', 'info');

        let data = JSON.parse(localStorage.getItem('absensi_zi'));
        data = data.sort((a, b)  => { return a.id - b.id; });
        var wb = XLSX.utils.book_new();
        var ws_name = "absensi";

        /* make worksheet */
        var ws_data = [[ "no", "kode", "nama", "masuk", "keluar"]];

        data.forEach((value, key) => {
            ws_data.push([key, value.id, value.name, value.in, value.out]);
        });
        ws_data.push([]);
        ws_data.push(['rilis', new Date().toJSON().split('T')[0], '', '']);
        var ws = XLSX.utils.aoa_to_sheet(ws_data);

        /* Add the worksheet to the workbook */
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        /* bookType can be any supported output type */
        var wopts = { bookType:'xlsx', bookSST:false, type:'array' };

        var wbout = XLSX.write(wb,wopts);

        /* the saveAs call downloads a file on the local machine */
        let nameFile = new Date().toJSON().split('T')[0] +  '.kemaren.absensi.xlsx';
        saveAs(new Blob([wbout],{type:"application/octet-stream"}), nameFile);

        localStorage.setItem('absensi_zi', JSON.stringify([]));
        localStorage.setItem('refresh', new Date().setHours(6, 0, 0, 0));
    }
}
function createQRcode(e) {
    e.preventDefault();
    let id = document.getElementById('id').value,
        name = document.getElementById('name').value,
        Obj = {id : id, name : name};
    Swal.fire({
        html : `<div id="qrcode"></div> <p style="text-align:center;"> ${name} </p>`,
        showConfirmButton : false,

    });

    new QRCode(document.getElementById("qrcode"), {
        text: JSON.stringify(Obj),
        logo: "data:image/png;base64,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",
        logoWidth: undefined,
        logoHeight: undefined,
        logoBackgroundColor: '#ffffffff',
        logoBackgroundTransparent: true,
        width: 256,
        height: 256
    });
    
    
}

autodownload()