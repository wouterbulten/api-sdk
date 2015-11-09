<?php

/**
 * Created for 123test BV.
 * User: theo
 * Date: 09-11-15
 * Time: 11:43
 */


//Change your api settings in the config file:
//Development modus in the config file: enable 'api-debug-mode' => true,
$config = require('config.php');
require_once('../../../php/Its123/Sdk/ApiHandler.php');

try
{
    $handler = new Its123\Sdk\ApiHandler($config['api-email-user-account'], $config['api-key'], $config['api-debug-mode']);
    $handlerData = $handler->requestAccess($config['product-id']);
}
catch(Exception $e)
{
    //Your Exception handler here
    if($config['api-debug-mode'])
    {
        throw $e;
    }
}

?>

<!DOCTYPE html>§
<html>
<head>
    <title>Welcome</title>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <meta name="robots" content="noindex" />
    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet">


    <style type="text/css">
        .its123-instrument .its123-legend {
            font-family: "Open Sans",Arial,sans-serif;
            font-weight: 300;
            font-size: 1.1em;
            line-height: 20px;
            color: #DB7B03;
            border: 0;
            float: left;
            margin-bottom: 10px;
        }

        .its123-instrument .its123-control {
            margin-bottom: 10px;
        }

        .its123-instrument .its123-radio-label {
            display: inline;
        }

        .its123-instrument .its123-radio {
            margin: 3px 5px 0 0;
        }

        .its123-instrument .its123-control-group {
            margin-bottom: 0;
            padding: 20px 0 20px 20px;
        }
        .its123-instrument .its123-control-group:nth-child(odd) {
            background-color: #eee;
        }

        .its123-instrument .its123-control-group:last-child {
            background-color: inherit;
        }
        .its123-instrument .its123-error {
            color: #C10000;
        }

    </style>
</head>
<body>
<div class="container-fluid">
    <div class="row-fluid">
        <div class="span2">
            <!--Sidebar content-->
        </div>
        <div class="span10">
            <!--Body content-->
            <div class="instrument-main-start">
                START HEAD
            </div>
            <div class="its123loading text-center alert alert-info" style="font-size: 1.5em;">
                <i class="icon-spinner icon-spin"></i>&nbsp;&nbsp;
                <h3>Loading</h3>
            </div>
            <div class="instrument-main-finish" style="display: none">
                FINISHED HEAD
            </div>
            <div id="instrument-main">
            </div>
            <div class="instrument-main-start">
                START TAIL
            </div>
            <div class="instrument-main-finish" style="display: none">
                FINISHED TAIL
            </div>
        </div>
    </div>
</div>
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script src="//api.123test.com/its123api-js.js?v=1&callback=its123Initialize&reportFinished=its123ReportFinishedAjax"></script>
<script type="application/javascript">


    function its123Initialize()
    {
        var productOptions = {
            publicApiKey: '<?php echo $handlerData->session; ?>', //Public key to load the api
            divIDProduct: 'instrument-main', //The Div tag where to apply the 123test product
            divClassLoadingComponent: 'its123loading', //Div classname loading tag
            userID:''//required, email or id unique to your system

        };

        its123.api.loadInstrument(productOptions, null);
    }

    function its123ReportFinished() {
        window.location.href = 'https://www.yoursite.com/report/<?php echo $handlerData->accessCode ?>' ;
    }

    function its123ReportFinishedAjax()
    {
        var productOptions = {
            divReportID: 'instrument-main', //The Div tag where to apply the 123test report
            divClassLoadingComponent: 'its123loading' //Div classname loading tag

        };

        its123.api.loadReport("standard", "<?php echo $handlerData->accessCode ?>"  ,productOptions);
    }

</script>
</body>
</html>