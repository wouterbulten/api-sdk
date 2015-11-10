<?php
//Quick start
//Basic Bootstrap 2 example
//Please check the config.php to configure the api settings
$authPassword = 'DEMO123';
$authPassed = false;
$authMessage = null;

//Make an auth implementation with your own intranet
function checkAuth($password = null)
{
    global $authMessage;
    if($password == null)
    {
        return false;
    }

    if(array_key_exists('its123_password', $_POST) && isset($_POST['its123_password']))
    {

        if($_POST['its123_password'] == $password)
        {
            return true;
        }
        else
        {
            sleep(2);
            $authMessage = "Password is not correct.";
            return false;
        }
    }
}

if(checkAuth($authPassword))
{
    $authPassed = true;
    require('instrument.php');
    return;
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Welcome</title>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <meta name="robots" content="noindex" />
    <link href="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap.min.css" rel="stylesheet">
    <link href="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap-responsive.min.css" rel="stylesheet">


    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body>
<div class="container">
    <div class="row">
        <div class="span12">
            <div class="" id="loginModal">
                <div class="modal-header">
                    <h3>Welcome</h3>
                </div>
                <div class="modal-body">
                    <div class="well">
                        <ul class="nav nav-tabs">
                            <li class="active"><a href="#login" data-toggle="tab">Login</a></li>

                        </ul>
                        <div id="myTabContent" class="tab-content">
                            <div class="tab-pane active in" id="login">
                                <form class="form-horizontal" action='' method="POST">
                                    <fieldset>
                                        <div id="legend">
                                            <legend class="">Login</legend>
                                        </div>
                                        <div class="control-group">
                                            <!-- Password-->
                                            <label class="control-label" for="password">Password</label>
                                            <div class="controls">
                                                <input type="password" id="its123_password" name="its123_password" required="required" placeholder="" class="input-xlarge">

                                                <?php
                                                    if(isset($authMessage) && strlen($authMessage) > 0)
                                                    {
                                                        echo "<div style='margin-top: 15px' class='alert alert-error'>$authMessage</div>";
                                                    }
                                                ?>
                                            </div>


                                        </div>


                                        <div class="control-group">
                                            <!-- Button -->
                                            <div class="controls">
                                                <button class="btn btn-success">Login</button>
                                            </div>
                                        </div>
                                    </fieldset>
                                </form>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>

</body>
