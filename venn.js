
$(function () {

	var file_cache = [];
	var set_index = ["A","B","C","D","E"];
	var n_venn_selected = 3;

	function power_set(set) {
		var count = set.length;
		var members = Math.pow(2, count);
		var ps = [];
		for(var i = 0; i < members; i++) {
			var b = i.toString(2);
			var s = [];
			for(var p = b.length; p < count; p++)b = "0" + b;
			for(var j = 0; j < b.length; j++) {
				if(b.charAt(j) === "1") {
					s.push(set[j]);
				}
			}
			if(s.length > 0)ps.push(s);
		}
		return ps;
	}

	function venn_set(data_set) {
		var keys = Object.keys(data_set);
		var data = [];
		var ps = power_set(keys);
		for(var i = 0; i < ps.length; i++) {
			var nkey = ps[i].join("");
			var diff_keys = _.difference(keys, ps[i]);

			var inter = data_set[ps[i][0]];
			if(ps[i].length > 1) {
				for(var j = 1; j < ps[i].length; j++)
					inter = _.intersection(inter, data_set[ps[i][j]]);
			}

			var result = inter;
			if(diff_keys.length > 0) {
				for(var j = 0; j < diff_keys.length; j++)
					result = _.difference(result, data_set[diff_keys[j]]);
			}
			data[nkey] = result;
		}
		return data;
	}

	function interface_set_svg_styles () {
		// styles must be applied inline
		// because the canvg library cant "see" css files
		$(".venn_diagram").css({
			"font-family": "sans-serif",
			"background-color": "white"
		});
		$("#venn2 text, #venn3 text").css({
			"font-size": "30px"
		});
		$("#venn4 text").css({
			"font-size": "12px"
		});
		$("#venn5 text").css({
			"font-size": "25px"
		});
		$("#venn5 a text").css({
			"font-size": "15px"
		});
	}

	function interface_update_group_selector() {
		$("#input_files").html("");
		for(var i = 0; i < n_venn_selected; i++) {
			var id = "file"+(i+1);

			var lbl = $("<label/>").attr("for", id).text("Set "+set_index[i]+":");

			var p1 = $("<a/>").addClass("close fileinput-exists").attr("href","#").html("&times;");
			p1.attr("data-dismiss","fileinput").css("float","none");
			var p2 = $("<span/>").addClass("fileinput-filename");
			var p3 = $("<span/>").addClass("btn btn-default btn-file");
			p3.append($("<span/>").addClass("fileinput-new").text("Select file"));
			p3.append($("<span/>").addClass("fileinput-exists").text("Change"));
			p3.append($("<input/>").attr("id",id).attr("type","file").attr("name",id));
			var e = $("<div/>").addClass("fileinput fileinput-new");
			e.attr("data-provides","fileinput");
			e.append(p3).append("&nbsp;").append(p2).append(p1);
			$("#input_files").append(lbl).append("&nbsp;").append(e).append("<br>");
			e.fileinput();
		}

		$("#venn_lists").children().remove();

		var set = [];
		for(var i = 0; i < n_venn_selected; i++)set[set_index[i]] = [];
		var ps_keys = Object.keys(venn_set(set));

		var url = window.location.href.split("#")[0];

		for(var i = 0; i < ps_keys.length; i++) {
			var a = $("#v"+n_venn_selected+ps_keys[i]);
			a.attr("xlink:href", url+"#list"+ps_keys[i]);
			a.find("text").text(ps_keys[i]);
		}

		$(".venn_diagram").hide();
		var v = $("#venn"+n_venn_selected);
		if(v.size()) {
			v.show();
			interface_set_export_svg_link(v[0]);
		}
	}

	function venn_read_input_file(file_number, callback) {
		var file = $("#file"+file_number)[0].files[0];
		var reader = new FileReader();
		reader.onload = function(evt) {
			file_cache["f"+file_number] = _.compact( evt.target.result.split(/\r?\n|\r/) );
			callback(file_number);
		};
		reader.readAsText(file);
	}

	function venn_read_files(n_venn, callback) {
		var cb = function(fn) {
			if(fn >= n_venn) callback();
			else venn_read_input_file(fn+1, cb);
		};
		cb(0);
	}

	function interface_make_diagram() {

		venn_read_files(n_venn_selected, function () {

			var set = [];
			for(var i = 1; i <= n_venn_selected; i++) {
				set[set_index[i-1]] = file_cache["f"+i];
			}

			var vs = venn_set(set);
			var keys = Object.keys(vs);

			$("#venn_lists").children().remove();
			for(var i = 0; i < keys.length; i++) {
				var d = $("<div/>").attr("id", "list"+keys[i])
				.append($("<a/>").attr("href", "#top")
					.append($("<h3/>").text(keys[i]+" ("+vs[keys[i]].length+")")));

				$("#v"+n_venn_selected+keys[i]+" text").text(vs[keys[i]].length);

				for(var j = 0; j < vs[keys[i]].length; j++) {
					d.append(vs[keys[i]][j]+"<br>");
				}
				$("#venn_lists").append(d).append("<hr/>");
			}

			interface_set_export_svg_link($("#venn"+n_venn_selected)[0]);
		});
	}

	$("#btn_venn").click(function () {
		interface_make_diagram();
	});

	function interface_update_diagram_size() {
		$(".venn_diagram").css({
			"width": $("#width_control").val(),
			"height": $("#height_control").val(),
		});
	}

	$("#width_control, #height_control").keyup(function () {
		interface_update_diagram_size();
	});

	$("#sel_venn2, #sel_venn3, #sel_venn4, #sel_venn5").click(function () {
		$("#sel_venn2, #sel_venn3, #sel_venn4, #sel_venn5").removeClass("active");

		n_venn_selected = $(this).attr("id").split("sel_venn")[1] * 1;
		interface_update_group_selector();
		$(this).addClass("active");
	});

	function interface_set_export_svg_link (venn_ele) {
		var svg_data = (new XMLSerializer).serializeToString(venn_ele);
		var canvas = $("#canvas")[0];
		canvg(canvas, svg_data);
		$("#export_image_link").attr("href", canvas.toDataURL());
		$("#export_svg_link").attr("href", "data:image/svg+xml,"+encodeURIComponent(svg_data));
	}

	function interface_init() {
		interface_set_svg_styles();
		interface_update_group_selector();
		$("#canvas").hide();

		$("#width_control").val("90%");
		$("#height_control").val("90%");
		interface_update_diagram_size();

		$("#venn2, #venn3, #venn4, #venn5").appendTo($("#venn_diagram"));
	}

	// -------------------------------------------------------

	interface_init();
});

