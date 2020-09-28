let storage = localStorage.getItem('absensi_zi');

if(!storage) { localStorage.setItem('absensi_zi', JSON.stringify([])); }
function q(element) {
    return document.querySelector(element);
}
function event(events) {
    
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
      drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
      drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
      drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
      drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
      
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
            timer: 3000,
            timerProgressBar: true,
            confirmButtonText  : 'Keluar Sekarang'
        }).then((result) => {
            if(result.isConfirmed) { return update(JSON.stringify(storage[0]))};
            
            reload(3000);
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