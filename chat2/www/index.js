(function(window,document){
  var doc = document;
  var ele = {
    oContainer: doc.getElementById("container"),
    oSendTxt: doc.getElementsByTagName("textarea")[0],
    oCloseBtn: doc.getElementsByName("close")[0],
    oSendBtn: doc.getElementsByName("send")[0],
    oRecord: doc.getElementById("record-box"),
    oNickName: doc.getElementById("nickName"),
    oFriendList: doc.getElementById("friend-list"),
    oFriendList_myPhoto: doc.querySelector("#friend-list li em"),
    oFriendList_myName: doc.querySelector("#friend-list li span"),
    oFriendList_num: doc.querySelector("#friends-box span"),
    aFriends: doc.getElementById("addInfo")
  };
  // 好友数组
  var friendsList=[];
  // 文件数组
  var fileList=[]
  // 我的用户名
  var userName;
  // 用于监听第几次发过来mes.friends，如果是第一次就在好友框加上所有好友否则只加上新增加的好友
  var count = 0;
  var count_file = 0;
  var socket = io.connect("/");
  function Chat(){
    // 获取用户昵称
    this.getNickName();
    // 发送消息
    this.sendMessage();
    // 接收文字消息
    this.receiveMessage();
    //接收头像信息
    this.receiveImg();
    // 发送表情包
    this.sendEmotion();
    // 发送与接收文件
    this.sendFile();
    // 接收文件
    this.receiveFile();
    // 退出聊天室
    this.out();
  }
  Chat.prototype = {
    // 获取用户昵称
    getNickName: function(){
      var nickName = prompt('昵称',"xxx");
      if(nickName){
        window.sessionStorage.setItem('nickName',nickName);
      }else {
        window.sessionStorage.setItem('nickName',"NULL");
      }
      userName = window.sessionStorage.getItem("nickName");
      console.log('myName:'+userName);
      socket.send(userName);
    },
    // 上传头像
    uploadHeadPhoto: function(){
      var oFileInput = doc.getElementsByName("headP")[0];
      var oHeadP = doc.getElementById("myHeadP");
      if(oFileInput){
        oFileInput.onchange = function(){
          console.log(this.files.item(0));
          var file = this.files[0];
          var reader = new FileReader();
          // 通过readAsDataURL读取图片
          reader.readAsDataURL(file);
          // readFile(this.files[0],oHeadP);
          reader.onload = function(){
            var data = {user:window.sessionStorage.getItem('nickName'),img: this.result};
            socket.emit('sendImg',data);
          }
        };
      }
      function readFile(file,aimArea){
        var blob = new Blob([file]);
        var url = window.URL.createObjectURL(blob);
        var img = new Image();
        // aimArea.innerHTML = '<img src="'+url+'" width="100%">';
      }
    },
    // 接收头像
    receiveImg:function(){
      socket.on('receiveImg',function(data){
        var oHeadP = doc.getElementById("myHeadP");
        console.log('收到');
        // console.log(data.img);
        console.log(data);
        if(data.user==userName){
          // 我的头像
          window.sessionStorage.setItem('myHeadPhoto',data.img);
          oHeadP.innerHTML = '<img src="'+data.img+'" width="100%">';
        }else {
          // 别人的头像
          console.log(JSON.parse(window.sessionStorage.getItem("friendsList")).indexOf(data.user));
          var key = JSON.parse(window.sessionStorage.getItem("friendsList")).indexOf(data.user);
          var aHeadP = doc.querySelectorAll("#friend-list li em");
          console.log(aHeadP);
          aHeadP[key].innerHTML = '<img src="'+data.img+'" width="100%">';
        }
      })
    },
    // 发送文件
    sendFile: function(){
      var upFileBtn = doc.getElementsByName("upFile")[0];
      var file_type=[]
      upFileBtn.onchange = function(){
        // console.log(this.files);
        console.log(this.files[0]);
        var file = this.files[0];
        var reader = new FileReader();
        if(file.type == "image/jpeg"||"image/png"){
          reader.readAsDataURL(file);
        }else {
            reader.readAsText(file);
        }
        reader.onload = function(){
          var data = {user: window.sessionStorage.getItem('nickName'),file:this.result,name:file.name,type:file.type,size:file.size,headP:window.sessionStorage.getItem('myHeadPhoto')};
          socket.emit('sendFile',data);
        }
      }
    },
    // 接收文件
    receiveFile: function() {
      socket.on('receiveFile',function(data){
        console.log(data);
        // 将文件数据保存在数组里
        // fileList.push(data);
        // 将文件数据用session缓存
        // window.sessionStorage('fileList',JSON.stringify(data));
        var oFileUl = doc.getElementById("file-list");
        var item = doc.createElement("li");
        if(data.type="text/plain") {
          item.innerHTML = "<a href='"+data.file+"' download='"+data.name+"'>"+data.name.split('.')[0]+"</a><span>"+data.name.split('.')[1]+"</span>";
        }else {
          item.innerHTML = "<a href='"+data.file+"'>"+data.name.split('.')[0]+"</a><span>"+data.name.split('.')[1]+"</span>"
        }
        oFileUl.appendChild(item);
      })
    },
    // 发送消息
    sendMessage: function(){
      //点击发送键
      document.getElementsByTagName("button")[1].onclick = write;
      // 回车发送消息
      document.addEventListener('keyup',function(e){
        e = e||window.e;
        if(e.keyCode == '13'){
          write();
        }
      })
      //将消息发送到后台
      function write(){
        var content = ele.oSendTxt.value;
        // 消息为空不发送
        if(!content){
          return;
        }else {
          ele.oSendTxt.value="";
          socket.send({"user":userName,"msg":content,"headPhoto":window.sessionStorage.getItem("myHeadPhoto")});
        }
      }
    },
    // 发送表情包
    sendEmotion: function(){
      var oEmotionUl = doc.getElementById("emotion"),
          oEmotionLi = oEmotionUl.getElementsByTagName("li"),
          oEmotionImg = oEmotionUl.getElementsByTagName("img");
      for(var i=0,len=oEmotionLi.length;i<len;i++) {
        (function(i){
          oEmotionLi[i].onclick = function(){
            socket.send({"user":userName,"imgUrl":oEmotionImg[i].src,"headPhoto":window.sessionStorage.getItem("myHeadPhoto")});
          }
        })(i)
      }
    },

    // 退出聊天室
    out: function() {
      // 点击退出按钮
      document.getElementsByTagName("button")[0].onclick = function(){
        var signOut = confirm("退出聊天室吗?");
        if(signOut) {
          console.log('要退出了');
          socket.send({'out':userName});
          ele.oContainer.style.cssText = "height: 0;overflow: hidden";
          window.sessionStorage.removeItem('user');
        }
        // 卸载页面退出聊天
        window.onbeforeunload = function(){
          socket.send({'out':userName});
        }
      }
    },
    // 接收消息
    receiveMessage: function(){
      var oChatRecordBox = doc.getElementById("record-box");
      // 如果监听到socket消息，那么执行这个方法并且广播消息
      socket.on("message",function(mes){
        count++;
        console.log(mes);
        console.log(mes.user);
        console.log(mes.msg);
        if(mes.friends){
          if(mes.out) {
            var aFriendLists = ele.oFriendList.getElementsByTagName("li");
            ele.aFriends.innerHTML = mes.out+"退出群聊";
            friendsList = JSON.parse(window.sessionStorage.getItem('friendsList'));
            var key = friendsList.indexOf(mes.out);
            ele.oFriendList.removeChild(aFriendLists[key]);
            // 更新好友信息
            window.sessionStorage.setItem("friendsList",JSON.stringify(mes.friends));
          }else if(mes.add) {
            console.log(count);
            // var friStr = mes.friends.join(',');
            var addFri = mes.add;
            if(addFri==userName) {
              ele.aFriends.innerHTML = "'我'"+"加入聊天室";
            }else {
              ele.aFriends.innerHTML = '"'+addFri+'"'+"加入聊天室";
            }
            // 保存好友信息
            window.sessionStorage.setItem('friendsList',JSON.stringify(mes.friends));
            ele.oFriendList_num.innerHTML = mes.friends.length;

            if(count==1){
              // 用户加入
              var frag = document.createDocumentFragment();
              for(var i=0,len=mes.friends.length;i<len;i++) {
                var item = document.createElement('li');
                if(mes.friends[i]==userName) {
                    item.innerHTML = "<em id='myHeadP'></em><span class='redColor'>"+mes.friends[i]+"</span><i>上传头像<input type='file' accept='image/png,image/gif' name='headP' value='上传头像'></i>";
                }else {
                    item.innerHTML = "<em></em><span>"+mes.friends[i]+"</span>";
                }
                frag.appendChild(item);
              }
              ele.oFriendList.appendChild(frag);
              // 在这实现上传头像功能
              Chat.prototype.uploadHeadPhoto();
            }else {
              var item = document.createElement('li');
              item.innerHTML = "<em></em><span>"+mes.add+"</span>";
              ele.oFriendList.appendChild(item);
            }
          }
        }else {
          // 接收消息
          if(mes.user==userName){
            var item = document.createElement("div");
            var myHeadPhoto = window.sessionStorage.getItem('myHeadPhoto');
            item.className = "right-div";
            if(mes.headPhoto&&mes.msg){
              item.innerHTML = "<em class='photo right-photo'><img src='"+mes.headPhoto+"' width='100%'></em><span class='name right-name'>"+userName+"</span><span class='say right-say'>"+mes.msg+"</span>";
            }else if(mes.imgUrl&&mes.headPhoto==undefined){
              console.log('表情包');
              item.innerHTML = "<em class='photo right-photo'></em><span class='name right-name'>"+userName+"</span><span class='say right-say'><img src='"+mes.imgUrl+"'></span>";
            }else if(mes.headPhoto!=undefined&&mes.imgUrl!=undefined) {
              item.innerHTML = "<em class='photo right-photo'><img src='"+mes.headPhoto+"' width='100%'></em><span class='name right-name'>"+userName+"</span><span class='say right-say'><img src='"+mes.imgUrl+"'></span>";
            }else {
              item.innerHTML = "<em class='photo right-photo'></em><span class='name right-name'>"+userName+"</span><span class='say right-say'>"+mes.msg+"</span>";
            }
            ele.oRecord.appendChild(item);
            // 保持滚动条始终在底部
            oChatRecordBox.scrollTop = oChatRecordBox.scrollHeight;
          }else {
            console.log('不是我');
            var saying = document.createElement('div');
            if(mes.headPhoto&&mes.msg){
              saying.innerHTML = "<em class='photo left-photo'><img src='"+mes.headPhoto+"' width='100%'></em><span class='name left-name'>"+mes.user+"</span><span class='say left-say'>"+mes.msg+"</span>";
            }else if(mes.imgUrl&&mes.headPhoto==undefined){
              saying.innerHTML = "<em class='photo left-photo'></em><span class='name left-name'>"+mes.user+"</span><span class='say left-say'><img src='"+mes.imgUrl+"'></span>";
            }else if(mes.imgUrl&&mes.headPhoto!=undefined){
              saying.innerHTML = "<em class='photo left-photo'><img src='"+mes.headPhoto+"' width='100%'></em><span class='name left-name'>"+mes.user+"</span><span class='say left-say'><img src='"+mes.imgUrl+"'></span>";
            }else {
              saying.innerHTML = "<em class='photo left-photo'></em><span class='name left-name'>"+mes.user+"</span><span class='say left-say'>"+mes.msg+"</span>";
            }
            ele.oRecord.appendChild(saying);
          }
        }
      })
    },

  };
  var char = new Chat();
})(window,document);
