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

    // Tải danh sách tất cả người dùng (API /users/)
    $('#load-all-users').click(function() {
        $.ajax({
            type: 'GET',
            url: '/users/',
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            beforeSend: function(xhr) {
                if (localStorage.token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.token);
                }
            },
            success: function(data) {
                var tbody = $('#users-table-body');
                tbody.empty();
                data.forEach(function(u, idx) {
                    tbody.append(
                        '<tr>' +
                        '<td>' + (idx + 1) + '</td>' +
                        '<td>' + u.id + '</td>' +
                        '<td>' + u.fullName + '</td>' +
                        '<td>' + u.email + '</td>' +
                        '<td>' + (u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A') + '</td>' +
                        '</tr>'
                    );
                });
                $('#users-list-card').show();
            },
            error: function() {
                alert("Không thể tải danh sách người dùng.");
            }
        });
    });
});
