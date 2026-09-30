$(document).ready(function() {
    // Kiểm tra nếu đang ở trang profile thì gọi API /users/me
    if ($('#profile').length > 0) {
        if (!localStorage.token) {
            alert("Sorry, you are not logged in.");
            window.location.href = "/login";
            return;
        }

        $.ajax({
            type: 'GET',
            url: '/users/me',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            beforeSend: function(xhr) {
                if (localStorage.token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
                }
            },
            success: function(data) {
                var json = JSON.stringify(data, null, 4);
                $('#profile').html(data.fullName);
                if ($('#email-display').length > 0) {
                    $('#email-display').html(data.email);
                }
                if ($('#token-display').length > 0) {
                    $('#token-display').val(localStorage.token);
                }
                if ($('#json-preview').length > 0) {
                    $('#json-preview').text(json);
                }

                // Xử lý ảnh avatar
                var imgSrc = data.images ? '/images/' + data.images : '/images/default-avatar.png';
                var imgElem = document.getElementById("images");
                if (imgElem) {
                    imgElem.src = imgSrc;
                }
            },
            error: function(e) {
                var json = e.responseText;
                if ($('#feedback').length > 0) {
                    $('#feedback').html(json);
                }
                console.log("ERROR: ", e);
                alert("Sorry, you are not logged in or your session has expired.");
                localStorage.clear();
                window.location.href = "/login";
            }
        });
    }

    // Hàm đăng xuất
    $('#logout').click(function() {
        localStorage.clear();
        window.location.href = "/login";
    });

    // Hàm Login
    $('#login').click(function(e) {
        if (e) e.preventDefault();
        var email = document.getElementById('email').value;
        var password = document.getElementById('password').value;

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ Email và Mật khẩu!");
            return;
        }

        var basicInfo = JSON.stringify({
            email: email,
            password: password
        });

        $('#login').prop('disabled', true).text('Đang đăng nhập...');

        $.ajax({
            type: "POST",
            url: "/auth/login",
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: basicInfo,
            success: function(data) {
                localStorage.token = data.token;
                console.log('Got a token from the server! Token: ' + data.token);
                window.location.href = "/user/profile";
            },
            error: function(xhr) {
                $('#login').prop('disabled', false).text('Login');
                var errorMsg = "Login Failed";
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.description) {
                        errorMsg += ": " + res.description;
                    } else if (res.detail) {
                        errorMsg += ": " + res.detail;
                    }
                } catch (e) {}
                alert(errorMsg);
            }
        });
    });

    // Hàm Đăng ký (Signup) hỗ trợ người dùng tạo tài khoản nhanh
    $('#signup-btn').click(function(e) {
        if (e) e.preventDefault();
        var fullName = $('#reg-fullname').val();
        var email = $('#reg-email').val();
        var password = $('#reg-password').val();

        if (!fullName || !email || !password) {
            alert("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!");
            return;
        }

        var registerData = JSON.stringify({
            fullName: fullName,
            email: email,
            password: password
        });

        $('#signup-btn').prop('disabled', true).text('Đang đăng ký...');

        $.ajax({
            type: "POST",
            url: "/auth/signup",
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: registerData,
            success: function(data) {
                alert("Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.");
                $('#reg-fullname').val('');
                $('#reg-email').val('');
                $('#reg-password').val('');
                $('#signup-btn').prop('disabled', false).text('Đăng ký');
                // Chuyển tab về login
                var loginTabTrigger = document.querySelector('#login-tab');
                if (loginTabTrigger) {
                    var tab = new bootstrap.Tab(loginTabTrigger);
                    tab.show();
                    $('#email').val(email);
                    $('#password').val(password);
                }
            },
            error: function(xhr) {
                $('#signup-btn').prop('disabled', false).text('Đăng ký');
                alert("Đăng ký thất bại. Email có thể đã tồn tại!");
            }
        });
    });

    // Tải danh sách tất cả người dùng (API /users/ được bảo vệ bằng JWT)
    $('#load-all-users').click(function(e) {
        if (e) e.preventDefault();

        if (!localStorage.token) {
            alert("Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
            window.location.href = "/login";
            return;
        }

        // 1. Mở Modal hiển thị trạng thái đang tải
        var usersModalElem = document.getElementById('usersModal');
        var usersModal = bootstrap.Modal.getOrCreateInstance(usersModalElem);
        usersModal.show();

        var btn = $('#load-all-users');
        var originalBtnText = btn.html();
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang tải...');

        $('#modal-users-tbody').html(
            '<tr><td colspan="6" class="text-center py-4 text-muted">' +
            '<span class="spinner-border spinner-border-sm text-primary me-2"></span>Đang truy vấn API /users/ với Nimbus JWT Bearer Token...' +
            '</td></tr>'
        );
        $('#modal-users-count').text('Đang tải...');

        $.ajax({
            type: 'GET',
            url: '/users/',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
            },
            success: function(data) {
                btn.prop('disabled', false).html(originalBtnText);

                var modalTbody = $('#modal-users-tbody');
                var inlineTbody = $('#users-table-body');
                modalTbody.empty();
                inlineTbody.empty();

                var countText = data.length + ' người dùng';
                $('#users-count-badge').text(countText);
                $('#modal-users-count').text(countText);

                if (!data || data.length === 0) {
                    var emptyRow = '<tr><td colspan="6" class="text-center py-3 text-muted">Chưa có người dùng nào.</td></tr>';
                    modalTbody.append(emptyRow);
                    inlineTbody.append(emptyRow);
                } else {
                    data.forEach(function(u, idx) {
                        var dateStr = u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : 'Vừa xong';
                        var badgeHtml = '<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1"><i class="fa-solid fa-check me-1"></i>Hoạt động</span>';
                        
                        var rowHtml = 
                            '<tr>' +
                            '<td class="ps-3 fw-bold text-secondary">' + (idx + 1) + '</td>' +
                            '<td><span class="badge bg-secondary-subtle text-secondary font-monospace">#' + u.id + '</span></td>' +
                            '<td class="fw-semibold text-dark"><i class="fa-regular fa-circle-user me-2 text-primary"></i>' + (u.fullName || 'N/A') + '</td>' +
                            '<td><span class="font-monospace text-primary">' + u.email + '</span></td>' +
                            '<td class="text-muted small">' + dateStr + '</td>' +
                            '<td class="pe-3">' + badgeHtml + '</td>' +
                            '</tr>';

                        modalTbody.append(rowHtml);
                        inlineTbody.append(rowHtml);
                    });
                }

                // Hiển thị thêm card inline bên dưới và cuộn mượt
                $('#users-list-card').slideDown(300);
            },
            error: function(xhr) {
                btn.prop('disabled', false).html(originalBtnText);
                var errorText = "Lỗi khi tải danh sách người dùng.";
                try {
                    var errObj = JSON.parse(xhr.responseText);
                    if (errObj.detail) errorText += " Chi tiết: " + errObj.detail;
                    if (errObj.description) errorText += " (" + errObj.description + ")";
                } catch (e) {}

                $('#modal-users-tbody').html(
                    '<tr><td colspan="6" class="text-center py-4 text-danger">' +
                    '<i class="fa-solid fa-triangle-exclamation me-2"></i>' + errorText +
                    '</td></tr>'
                );
                $('#modal-users-count').text('Lỗi kết nối');
                alert(errorText);
            }
        });
    });
});
