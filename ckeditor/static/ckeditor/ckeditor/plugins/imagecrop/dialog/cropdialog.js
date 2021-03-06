(function() {
"use strict";

CKEDITOR.dialog.add( "ImageCrop", function( editor )
{
	var lang = editor.lang.imagecrop,
		dialogReady = false,
		theDialog;
	var theDiv;
	var img_obj;

	//	CKEDITOR.scriptLoader.load( "http://code.jquery.com/jquery-1.11.1.min.js", loadJcrop);
	if (typeof window.jQuery == "undefined")
		CKEDITOR.scriptLoader.load( "http://code.jquery.com/jquery-2.1.1.min.js", loadJcrop);
	else
		loadJcrop();

	function loadJcrop()
	{
		var plugin = editor.plugins.imagecrop;
		
		if (typeof window.imageCrop=="undefined")
			CKEDITOR.scriptLoader.load( plugin.path + "dialog/imagecrop.js", show);

		/*if (typeof jQuery.Jcrop=="undefined")
		{*/
			CKEDITOR.document.appendStyleSheet( plugin.path + "dialog/imagecrop.css" );

			CKEDITOR.scriptLoader.load( plugin.path + "dialog/pica.min.js");
			CKEDITOR.scriptLoader.load( plugin.path + "dialog/jquery.jcrop.js", show);
		/*}*/
	}

	function show()
	{
		img_obj = null;
		if (!theDialog || !dialogReady)
			return;

		if (typeof window.jQuery == "undefined")
			return;

		if (typeof jQuery.Jcrop=="undefined")
			return;

		if (typeof window.imageCrop == "undefined")
			return;

		var o = theDialog.getContentElement( "info", "CropContainer" );
		theDiv = o.getElement().$;

		// a single object with all the configuration options to make it easier to upgrade and extend it
		var config = editor.config.imagecrop || {};

		// Backward compatibility
		if (editor.config.imagecrop_cropsizes)
			config.cropsizes = editor.config.imagecrop_cropsizes;

		if (editor.config.imagecrop_formats)
			config.formats = editor.config.imagecrop_formats;


		// copy to reuse existing common entries
		lang.width = editor.lang.common.width;
		lang.height = editor.lang.common.height;

		imageCrop.onCropClick = function() {
			theDialog.fire("ok", {});
			theDialog.hide();
		};

		var img, name;
		if (theDialog.srcData) {
			img = theDialog.srcData.image;
			name = theDialog.srcData.name;
		}
		else {
			img_obj = editor.getSelection().getSelectedElement();
			if ( !img_obj || !img_obj.is("img") )
			{
				if (editor.widgets)
				{
					var widget = editor.widgets.focused;
					// hardcoded image2
					if (widget && (widget.name == "image2"||widget.name == "image") )
					{
						var el = widget.element;
						if (el)
						{
							if (el.getName() == "img")
								img_obj = el;
							else
							{
								var children = el.getElementsByTag("img");
								if (children.count()==1)
									img_obj = children.getItem(0);
							}
						}
					}

				}
			}

			// On rare situations it's possible to launch the dialog without an image selected
			// -> in IE select an image, click outside the editor and the button will remain enabled,
			//		but img_obj will be null
			if ( !img_obj || !img_obj.is("img") )
			{
				alert( lang.msgImageNotSelected );
				theDialog.hide();
				return;
			}
/*
			var src = img_obj.data ? img_obj.data("cke-saved-src") : img_obj.getAttribute("_cke_saved_src");

			if (!src)
				src = img_obj.$.src;
*/
			img = img_obj.$;
			name = img_obj.$.src.match(/\/([^\/]*)$/)[1];
		}

		imageCrop.showUI(theDiv, img, name, theDialog.srcData && theDialog.srcData.file, editor.id, lang, config);

		RefreshSize();
	}

	function RefreshSize()
	{
		var contents = theDialog.parts.contents,
			table = contents.getFirst().getFirst(),
			picContainer = theDiv.querySelector(".imagecrop-viewer");

		picContainer.style.width = (parseInt(contents.$.style.width, 10) - (200 + table.$.offsetLeft)) + "px";
		picContainer.style.height = (parseInt(contents.$.style.height, 10) - ((table.$.offsetTop))) + "px";
	}


	return {
		title : lang.title,
		minWidth : 400,
		minHeight : 300,
		width: 700,
		height: 500,
		contents :
		[
			{
				id : "info",
				label : "Imagenes",
				title : "Imagenes",
				elements :
				[
					{
						type: "html",
						id : "CropContainer",
						html : '&nbsp;'
					}
				]
			}
		],
		onLoad : function()
		{
			theDialog = this;
			theDialog.on("resize", RefreshSize);
		},
		onShow : function()
		{
			dialogReady = true;
			show();
		},
		onHide : function()
		{
			delete this.srcData;
			img_obj = null;

			// Notify that we have finished to check if there's something else pending
			CKEDITOR.plugins.imagecrop.finishedImage();
		},
		onOk : function()
		{
			imageCrop.getImage( function(file, name) {
				var data = theDialog.srcData;

				// we're editing an existing image, let's create the event data
				if (!data)
				{
					// the user hasn't edited it, so let's get out.
					if (!file)
					{
						theDialog.hide();
						return;
					}

//					var name = img_obj.$.src.match(/\/([^\/]*)$/)[1];
					data = {
						context : "ImageCrop",
						name : name,
						callback : null,
						requiresImage : true,
						forceLink : false,
						mode : {
							type : 'selectedFile',
							i : 1,
							count : 1
						},
						image: {} // faked image just to avoid re-processing
					}

				}

				if (file) {
					data.file = file;
					data.name = name;
				}
				else
				{
					// The images pasted from the clipboard are always in png and with an automatic name based on the id.
					// Convert them to jpg
					if (data.id + ".png" == data.name)
					{
						var o = imageCrop.convertImage(data.image, data.name, "jpg80");
						data.file = o.image;
						data.name = o.name;
					}
				}

				theDialog.hide();
				CKEDITOR.plugins.simpleuploads.insertProcessedFile(editor, data);

			});
			return false;
		}
	};

});



})();